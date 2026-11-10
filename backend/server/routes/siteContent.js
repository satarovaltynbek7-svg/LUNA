import { Router } from 'express'
import { prisma } from '../db.js'
import { asyncHandler } from '../lib/errors.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  const now = new Date()
  const [banners, content] = await prisma.$transaction([
    prisma.promotionalBanner.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.siteContent.findMany({ select: { key: true, value: true } }),
  ])
  res.json({ banners, content })
}))

export default router
