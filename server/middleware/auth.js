import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { prisma } from '../db.js'
import { ApiError, asyncHandler } from '../lib/errors.js'

export const authCookieName = 'luna_session'

export function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id, version: user.sessionVersion }, config.JWT_SECRET, { expiresIn: '7d', issuer: 'luna-cafe', audience: 'luna-cafe-web' })
  res.cookie(authCookieName, token, {
    httpOnly: true,
    secure: config.production,
    sameSite: config.production ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function clearSession(res) {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    secure: config.production,
    sameSite: config.production ? 'none' : 'lax',
    path: '/',
  })
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies[authCookieName]
  if (!token) throw new ApiError(401, 'authentication_required')
  let claims
  try {
    claims = jwt.verify(token, config.JWT_SECRET, { issuer: 'luna-cafe', audience: 'luna-cafe-web' })
  } catch {
    throw new ApiError(401, 'invalid_session')
  }
  const user = await prisma.user.findUnique({ where: { id: claims.sub } })
  if (!user || claims.version !== user.sessionVersion) throw new ApiError(401, 'invalid_session')
  req.user = user
  next()
})

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies[authCookieName]
  if (!token) return next()
  let claims
  try {
    claims = jwt.verify(token, config.JWT_SECRET, { issuer: 'luna-cafe', audience: 'luna-cafe-web' })
  } catch {
    return next()
  }
  const user = await prisma.user.findUnique({ where: { id: claims.sub } })
  if (user && claims.version === user.sessionVersion) req.user = user
  return next()
})

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN' || req.user.email !== config.OWNER_EMAIL) {
    return next(new ApiError(403, 'admin_required'))
  }
  next()
}

export function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    createdAt: user.createdAt,
  }
}
