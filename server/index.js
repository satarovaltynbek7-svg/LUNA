import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { config } from './config.js'
import { prisma } from './db.js'
import { ensureOwnerAccount } from './owner.js'
import { seedCatalog } from './seed.js'
import { asyncHandler, errorHandler } from './lib/errors.js'
import adminRoutes from './routes/admin.js'
import adminResourceRoutes from './routes/adminResources.js'
import authRoutes from './routes/auth.js'
import galleryRoutes from './routes/gallery.js'
import menuRoutes from './routes/menu.js'
import orderRoutes from './routes/orders.js'
import reviewRoutes from './routes/reviews.js'
import reservationRoutes from './routes/reservations.js'
import siteContentRoutes from './routes/siteContent.js'

const app = express()
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const frontendDirectory = path.resolve(currentDirectory, '..', 'dist')
const frontendOrigin = new URL(config.FRONTEND_URL).origin
const backendOrigin = new URL(config.BACKEND_URL).origin

app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === frontendOrigin || origin === backendOrigin) return callback(null, true)
    return callback(new Error('cors_origin_denied'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '20kb' }))
app.use(cookieParser())
app.use('/api', (req, res, next) => {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) return next()
  if (req.path === '/auth/google/callback') return next()
  const origin = req.get('origin')
  if ([frontendOrigin, backendOrigin].includes(origin)) return next()
  return res.status(403).json({ error: 'untrusted_request_origin' })
})
app.use((req, res, next) => {
  if (req.path === '/admin' || req.path.startsWith('/admin/')) {
    res.set('X-Robots-Tag', 'noindex, nofollow')
  }
  next()
})

app.get('/api/health', asyncHandler(async (req, res) => {
  await prisma.$queryRaw`SELECT 1`
  res.json({ status: 'ok' })
}))
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: 'too_many_requests' }),
}), authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}), orderRoutes)
app.use('/api/reservations', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}), reservationRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/gallery', galleryRoutes)
app.use('/api/site-content', siteContentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin', adminResourceRoutes)
app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }))
app.use(express.static(frontendDirectory, { index: false, maxAge: config.production ? '1y' : 0 }))
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(frontendDirectory, 'index.html'), (error) => {
    if (error) next(error)
  })
})
app.use(errorHandler)

await prisma.$connect()
await ensureOwnerAccount()
await seedCatalog()
const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`LUNA API listening on port ${config.PORT}`)
})

process.once('SIGTERM', () => {
  server.close(() => prisma.$disconnect().finally(() => process.exit(0)))
})
