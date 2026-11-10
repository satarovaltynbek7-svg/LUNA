import { Router } from 'express'
import { prisma } from '../db.js'
import { asyncHandler } from '../lib/errors.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  const images = await prisma.galleryImage.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  res.json({ images })
}))

export default router
