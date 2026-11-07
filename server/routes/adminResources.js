import { Router } from 'express'
import { prisma } from '../db.js'
import { ApiError, asyncHandler } from '../lib/errors.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import {
  bannerEditSchema,
  bannerSchema,
  galleryImageEditSchema,
  galleryImageSchema,
  menuCategoryEditSchema,
  menuCategorySchema,
  menuItemEditSchema,
  menuItemSchema,
  orderStatusSchema,
  pageSchema,
  parseId,
  reservationStatusSchema,
  siteContentSchema,
} from '../middleware/validation.js'

const router = Router()
router.use(requireAuth, requireAdmin)

function listPage(query) {
  const { page, limit } = pageSchema.parse(query)
  return { page, limit, skip: (page - 1) * limit }
}

function paginated(records, total, paging) {
  return {
    records,
    pagination: { page: paging.page, limit: paging.limit, total, pages: Math.ceil(total / paging.limit) },
  }
}

router.get('/dashboard', asyncHandler(async (req, res) => {
  const [customers, menuItems, newOrders, pendingReservations, pendingReviews, recentOrders] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.menuItem.count({ where: { active: true } }),
    prisma.cafeOrder.count({ where: { status: { in: ['NEW', 'CONFIRMED', 'PREPARING', 'READY'] } } }),
    prisma.reservation.count({ where: { status: 'PENDING' } }),
    prisma.review.count({ where: { status: 'PENDING' } }),
    prisma.cafeOrder.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { lines: true } }),
  ])
  res.json({
    statistics: { customers, menuItems, openOrders: newOrders, pendingReservations, pendingReviews },
    recentOrders,
  })
}))

router.get('/menu', asyncHandler(async (req, res) => {
  const categories = await prisma.menuCategory.findMany({
    include: { items: { orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }] } },
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
  })
  res.json({ categories })
}))

router.post('/menu/categories', asyncHandler(async (req, res) => {
  const input = menuCategorySchema.parse(req.body)
  const category = await prisma.menuCategory.create({ data: input })
  res.status(201).json({ category })
}))

router.patch('/menu/categories/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const input = menuCategoryEditSchema.parse(req.body)
  const category = await prisma.menuCategory.update({ where: { id }, data: input })
  res.json({ category })
}))

router.delete('/menu/categories/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  if (await prisma.menuItem.count({ where: { categoryId: id } })) {
    throw new ApiError(409, 'category_has_menu_items')
  }
  await prisma.menuCategory.delete({ where: { id } })
  res.status(204).end()
}))

router.post('/menu/items', asyncHandler(async (req, res) => {
  const input = menuItemSchema.parse(req.body)
  if (!await prisma.menuCategory.findUnique({ where: { id: input.categoryId } })) {
    throw new ApiError(400, 'invalid_menu_category')
  }
  const item = await prisma.menuItem.create({ data: input })
  res.status(201).json({ item })
}))

router.patch('/menu/items/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const input = menuItemEditSchema.parse(req.body)
  if (input.categoryId && !await prisma.menuCategory.findUnique({ where: { id: input.categoryId } })) {
    throw new ApiError(400, 'invalid_menu_category')
  }
  const item = await prisma.menuItem.update({ where: { id }, data: input })
  res.json({ item })
}))

router.delete('/menu/items/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.menuItem.delete({ where: { id } })
  res.status(204).end()
}))

router.get('/orders', asyncHandler(async (req, res) => {
  const paging = listPage(req.query)
  const status = req.query.status?.toString().toUpperCase()
  if (status && !['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].includes(status)) {
    throw new ApiError(400, 'invalid_order_status')
  }
  const where = status ? { status } : {}
  const [records, total] = await prisma.$transaction([
    prisma.cafeOrder.findMany({
      where, include: { lines: true },
      orderBy: { createdAt: 'desc' }, skip: paging.skip, take: paging.limit,
    }),
    prisma.cafeOrder.count({ where }),
  ])
  res.json(paginated(records, total, paging))
}))

router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const { status } = orderStatusSchema.parse(req.body)
  const order = await prisma.cafeOrder.update({ where: { id }, data: { status }, include: { lines: true } })
  res.json({ order })
}))

router.get('/reservations', asyncHandler(async (req, res) => {
  const paging = listPage(req.query)
  const status = req.query.status?.toString().toUpperCase()
  if (status && !['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED'].includes(status)) {
    throw new ApiError(400, 'invalid_reservation_status')
  }
  const where = status ? { status } : {}
  const [records, total] = await prisma.$transaction([
    prisma.reservation.findMany({
      where, orderBy: { dateTime: 'asc' }, skip: paging.skip, take: paging.limit,
    }),
    prisma.reservation.count({ where }),
  ])
  res.json(paginated(records, total, paging))
}))

router.patch('/reservations/:id/status', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const { status } = reservationStatusSchema.parse(req.body)
  const reservation = await prisma.reservation.update({ where: { id }, data: { status } })
  res.json({ reservation })
}))

router.delete('/reservations/:id', asyncHandler(async (req, res) => {
  await prisma.reservation.delete({ where: { id: parseId(req.params.id) } })
  res.status(204).end()
}))

router.get('/customers', asyncHandler(async (req, res) => {
  const paging = listPage(req.query)
  const search = req.query.search?.toString().trim().slice(0, 100)
  const where = {
    role: 'USER',
    ...(search ? {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
  }
  const [records, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, fullName: true, email: true, avatar: true, createdAt: true, _count: { select: { reviews: true, orders: true } } },
      orderBy: { createdAt: 'desc' }, skip: paging.skip, take: paging.limit,
    }),
    prisma.user.count({ where }),
  ])
  res.json(paginated(records, total, paging))
}))

router.get('/gallery', asyncHandler(async (req, res) => {
  const images = await prisma.galleryImage.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] })
  res.json({ images })
}))

router.post('/gallery', asyncHandler(async (req, res) => {
  const input = galleryImageSchema.parse(req.body)
  const image = await prisma.galleryImage.create({ data: input })
  res.status(201).json({ image })
}))

router.patch('/gallery/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const input = galleryImageEditSchema.parse(req.body)
  const image = await prisma.galleryImage.update({ where: { id }, data: input })
  res.json({ image })
}))

router.delete('/gallery/:id', asyncHandler(async (req, res) => {
  await prisma.galleryImage.delete({ where: { id: parseId(req.params.id) } })
  res.status(204).end()
}))

router.get('/content', asyncHandler(async (req, res) => {
  const [content, banners] = await prisma.$transaction([
    prisma.siteContent.findMany({ orderBy: { key: 'asc' } }),
    prisma.promotionalBanner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] }),
  ])
  res.json({ content, banners })
}))

router.put('/content/:key', asyncHandler(async (req, res) => {
  const input = siteContentSchema.parse({ key: req.params.key, value: req.body?.value })
  const setting = await prisma.siteContent.upsert({
    where: { key: input.key },
    create: input,
    update: { value: input.value },
  })
  res.json({ setting })
}))

router.post('/banners', asyncHandler(async (req, res) => {
  const input = bannerSchema.parse(req.body)
  const banner = await prisma.promotionalBanner.create({ data: input })
  res.status(201).json({ banner })
}))

router.patch('/banners/:id', asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const input = bannerEditSchema.parse(req.body)
  const existing = await prisma.promotionalBanner.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'not_found')
  bannerSchema.parse({
    ...existing,
    ...input,
    imageUrl: input.imageUrl ?? existing.imageUrl ?? '',
    linkUrl: input.linkUrl ?? existing.linkUrl ?? '',
  })
  const banner = await prisma.promotionalBanner.update({ where: { id }, data: input })
  res.json({ banner })
}))

router.delete('/banners/:id', asyncHandler(async (req, res) => {
  await prisma.promotionalBanner.delete({ where: { id: parseId(req.params.id) } })
  res.status(204).end()
}))

export default router
