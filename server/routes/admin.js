import { Router } from 'express'
import { prisma } from '../db.js'
import { ApiError, asyncHandler } from '../lib/errors.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { pageSchema, parseId } from '../middleware/validation.js'

const router = Router()
router.use(requireAuth, requireAdmin)

router.get('/reviews', asyncHandler(async (req, res) => {
  const { page, limit } = pageSchema.parse(req.query)
  const rating = req.query.rating === undefined ? undefined : Number(req.query.rating)
  const status = req.query.status?.toString().toUpperCase()
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new ApiError(400, 'invalid_rating')
  }
  if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) throw new ApiError(400, 'invalid_status')
  const where = { ...(rating ? { rating } : {}), ...(status ? { status } : {}) }
  const [records, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      include: { user: { select: { fullName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ])
  res.json({
    reviews: records.map((review) => ({
      id: review.id,
      userId: review.userId,
      userName: review.user.fullName,
      userPhoto: review.user.avatar,
      rating: review.rating,
      text: review.text,
      status: review.status.toLowerCase(),
      featured: review.isFeatured,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}))

router.patch('/reviews/:id/approve', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const review = await prisma.review.update({
    where: { id },
    data: { status: 'APPROVED' },
  })
  res.json({ id: review.id, status: review.status.toLowerCase(), featured: review.isFeatured })
}))

router.patch('/reviews/:id/reject', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const review = await prisma.review.update({
    where: { id },
    data: { status: 'REJECTED', isFeatured: false },
  })
  res.json({ id: review.id, status: review.status.toLowerCase(), featured: review.isFeatured })
}))

router.patch('/reviews/:id/featured', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  if (typeof req.body?.isFeatured !== 'boolean') throw new ApiError(400, 'invalid_featured_value')
  const existing = await prisma.review.findUnique({ where: { id }, select: { status: true } })
  if (!existing) throw new ApiError(404, 'not_found')
  if (req.body.isFeatured && existing.status !== 'APPROVED') throw new ApiError(409, 'only_approved_reviews_can_be_featured')
  const review = await prisma.review.update({
    where: { id },
    data: { isFeatured: req.body.isFeatured },
  })
  res.json({ id: review.id, status: review.status.toLowerCase(), featured: review.isFeatured })
}))

router.delete('/reviews/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.review.delete({ where: { id } })
  res.status(204).end()
}))

export default router
