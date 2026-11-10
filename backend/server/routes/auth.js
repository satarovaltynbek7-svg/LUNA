import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { config } from '../config.js'
import { prisma } from '../db.js'
import { ApiError, asyncHandler } from '../lib/errors.js'
import { clearSession, issueSession, optionalAuth, publicUser, requireAuth } from '../middleware/auth.js'
import { emailSchema, loginSchema, registerSchema, resetSchema } from '../middleware/validation.js'

const router = Router()
const googleOAuth = config.googleEnabled
  ? new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_CALLBACK_URL)
  : null
const resetLimiterTransport = config.smtpEnabled
  ? nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE === 'true',
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
  })
  : null

const hashToken = (token) => createHash('sha256').update(token).digest('hex')

router.post('/register', asyncHandler(async (req, res) => {
  const { fullName, email, password } = registerSchema.parse(req.body)
  if (email === config.OWNER_EMAIL) throw new ApiError(403, 'owner_account_reserved')
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { fullName, email, passwordHash } })
  issueSession(res, user)
  res.status(201).json({ user: publicUser(user) })
}))

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body)
  const user = await prisma.user.findUnique({ where: { email } })
  const matches = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false
  if (!matches) throw new ApiError(401, 'invalid_credentials')
  issueSession(res, user)
  res.json({ user: publicUser(user) })
}))

router.post('/logout', optionalAuth, asyncHandler(async (req, res) => {
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { sessionVersion: { increment: 1 } },
    })
  }
  clearSession(res)
  res.status(204).end()
}))

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = emailSchema.parse(req.body)
  if (!resetLimiterTransport) throw new ApiError(503, 'password_reset_unavailable')
  const user = await prisma.user.findUnique({ where: { email } })
  if (user?.passwordHash) {
    const token = randomBytes(32).toString('hex')
    const tokenHash = hashToken(token)
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      }),
    ])
    const resetUrl = new URL('/reset-password', config.FRONTEND_URL)
    resetUrl.searchParams.set('token', token)
    try {
      await resetLimiterTransport.sendMail({
        from: config.SMTP_FROM,
        to: user.email,
        subject: 'Reset your LUNA Café password',
        text: `Use this link within one hour to reset your password: ${resetUrl.href}`,
        html: `<p>Use this link within one hour to reset your LUNA Café password:</p><p><a href="${resetUrl.href}">Reset password</a></p>`,
      })
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({ where: { tokenHash } })
      console.error('Password reset email delivery failed:', error)
      throw new ApiError(503, 'password_reset_unavailable')
    }
  }
  res.json({ message: 'If an account exists for this address, a reset link has been sent.' })
}))

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = resetSchema.parse(req.body)
  const tokenHash = hashToken(token)
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
  if (!reset || reset.expiresAt <= new Date()) throw new ApiError(400, 'invalid_or_expired_token')
  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.$transaction(async (transaction) => {
    const deleted = await transaction.passwordResetToken.deleteMany({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    })
    if (deleted.count !== 1) throw new ApiError(400, 'invalid_or_expired_token')
    await transaction.user.update({
      where: { id: reset.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    })
    await transaction.passwordResetToken.deleteMany({ where: { userId: reset.userId } })
  })
  clearSession(res)
  res.json({ message: 'Password reset successfully.' })
}))

router.get('/google', (req, res) => {
  if (!googleOAuth) {
    const url = new URL('/?authError=google_login_unavailable', config.FRONTEND_URL)
    return res.redirect(url.href)
  }
  const state = randomBytes(32).toString('hex')
  res.cookie('luna_google_state', state, {
    httpOnly: true,
    secure: config.production,
    sameSite: 'lax',
    path: '/api/auth/google/callback',
    maxAge: 10 * 60 * 1000,
  })
  const url = googleOAuth.generateAuthUrl({
    access_type: 'online',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile'],
    state,
  })
  res.redirect(url)
})

router.get('/google/callback', asyncHandler(async (req, res) => {
  const fail = (reason) => res.redirect(new URL(`/?authError=${encodeURIComponent(reason)}`, config.FRONTEND_URL).href)
  const expectedState = req.cookies.luna_google_state
  res.clearCookie('luna_google_state', {
    httpOnly: true,
    secure: config.production,
    sameSite: 'lax',
    path: '/api/auth/google/callback',
  })
  if (!googleOAuth) return fail('google_login_unavailable')
  if (typeof req.query.state !== 'string' || typeof expectedState !== 'string') return fail('google_state_invalid')
  const supplied = Buffer.from(req.query.state)
  const expected = Buffer.from(expectedState)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return fail('google_state_invalid')
  if (typeof req.query.code !== 'string') return fail('google_login_failed')

  try {
    const { tokens } = await googleOAuth.getToken(req.query.code)
    if (!tokens.id_token) return fail('google_login_failed')
    const ticket = await googleOAuth.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.GOOGLE_CLIENT_ID,
    })
    const identity = ticket.getPayload()
    if (!identity?.sub || !identity.email || identity.email_verified !== true) return fail('google_email_unverified')

    const email = z.string().email().parse(identity.email).toLowerCase()
    let user = await prisma.user.findUnique({ where: { googleId: identity.sub } })
    if (!user) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing?.googleId && existing.googleId !== identity.sub) return fail('google_account_conflict')
      if (existing?.passwordHash) return fail('google_account_conflict')
      user = existing
        ? await prisma.user.update({
          where: { id: existing.id },
          data: { googleId: identity.sub, avatar: existing.avatar || identity.picture || null },
        })
        : await prisma.user.create({
          data: {
            fullName: (identity.name || email.split('@')[0]).slice(0, 100),
            email,
            googleId: identity.sub,
            avatar: identity.picture || null,
          },
        })
    }

    issueSession(res, user)
    res.redirect(new URL('/?auth=success', config.FRONTEND_URL).href)
  } catch (error) {
    console.error('Google OAuth callback failed:', error)
    return fail('google_login_failed')
  }
}))

export default router
