import { Router } from 'express'
import { prisma } from '../db.js'
import { asyncHandler } from '../lib/errors.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  const categories = await prisma.menuCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
  })
  const items = await prisma.menuItem.findMany({
    where: { active: true, category: { active: true } },
    include: { category: { select: { slug: true } } },
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
  })
  res.json({
    categories: categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      names: category.names,
    })),
    items: items.map((item) => ({
      id: item.id,
      slug: item.slug,
      category: item.category.slug,
      names: item.names,
      descriptions: item.descriptions,
      price: item.price,
      image: item.imageUrl,
      isPopular: item.isPopular,
    })),
  })
}))

export default router
