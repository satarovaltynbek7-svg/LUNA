import { Router } from 'express'
import { prisma } from '../db.js'
import { ApiError, asyncHandler } from '../lib/errors.js'
import { requireAuth } from '../middleware/auth.js'
import { pageSchema, parseId, reviewEditSchema, reviewSchema } from '../middleware/validation.js'

const router = Router()

function pagination(query) {
  const { page, limit } = pageSchema.parse(query)
  return { page, limit, skip: (page - 1) * limit }
}

function serializeReview(review) {
  return {
    id: review.id,
    userName: review.user.fullName,
    userPhoto: review.user.avatar,
    rating: review.rating,
    text: review.text,
    status: review.status.toLowerCase(),
    featured: review.isFeatured,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }
}

async function pageReviews(where, paging, orderBy = { createdAt: 'desc' }) {
  const [records, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      include: { user: { select: { fullName: true, avatar: true } } },
      orderBy,
      skip: paging.skip,
      take: paging.limit,
    }),
    prisma.review.count({ where }),
  ])
  return {
    reviews: records.map(serializeReview),
    pagination: { page: paging.page, limit: paging.limit, total, pages: Math.ceil(total / paging.limit) },
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const paging = pagination(req.query)
  const rating = req.query.rating === undefined ? undefined : Number(req.query.rating)
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new ApiError(400, 'invalid_rating')
  }
  const sort = req.query.sort || 'newest'
  if (!['newest', 'highest', 'lowest'].includes(sort)) throw new ApiError(400, 'invalid_sort')
  const where = { status: 'APPROVED', ...(rating ? { rating } : {}) }
  const orderBy = sort === 'highest'
    ? [{ rating: 'desc' }, { createdAt: 'desc' }]
    : sort === 'lowest'
      ? [{ rating: 'asc' }, { createdAt: 'desc' }]
      : { createdAt: 'desc' }
  const result = await pageReviews(where, paging, orderBy)
  const distribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { status: 'APPROVED' },
    _count: { _all: true },
  })
  const counts = Object.fromEntries([1, 2, 3, 4, 5].map((score) => [
    score,
    distribution.find((entry) => entry.rating === score)?._count._all || 0,
  ]))
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  res.json({
    ...result,
    summary: {
      total,
      average: total ? [1, 2, 3, 4, 5].reduce((sum, score) => sum + score * counts[score], 0) / total : 0,
      distribution: counts,
    },
  })
}))

router.get('/featured', asyncHandler(async (req, res) => {
  const paging = pagination(req.query)
  paging.limit = Math.min(paging.limit, 3)
  paging.skip = (paging.page - 1) * paging.limit
  res.json(await pageReviews({ status: 'APPROVED', isFeatured: true }, paging))
}))

router.get('/my', requireAuth, asyncHandler(async (req, res) => {
  res.json(await pageReviews({ userId: req.user.id }, pagination(req.query)))
}))

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const input = reviewSchema.parse(req.body)
  const review = await prisma.review.create({
    data: { ...input, userId: req.user.id },
    include: { user: { select: { fullName: true, avatar: true } } },
  })
  res.status(201).json({ review: serializeReview(review) })
}))

router.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const input = reviewEditSchema.parse(req.body)
  const review = await prisma.review.findFirst({ where: { id, userId: req.user.id } })
  if (!review) throw new ApiError(404, 'not_found')
  if (review.status !== 'PENDING') throw new ApiError(409, 'review_not_editable')
  const updated = await prisma.review.update({
    where: { id },
    data: input,
    include: { user: { select: { fullName: true, avatar: true } } },
  })
  res.json({ review: serializeReview(updated) })
}))

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const deleted = await prisma.review.deleteMany({ where: { id, userId: req.user.id } })
  if (!deleted.count) throw new ApiError(404, 'not_found')
  res.status(204).end()
}))

export default router
