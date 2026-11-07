import { Router } from 'express'
import { prisma } from '../db.js'
import { asyncHandler } from '../lib/errors.js'
import { reservationCreateSchema } from '../middleware/validation.js'

const router = Router()

router.post('/', asyncHandler(async (req, res) => {
  const input = reservationCreateSchema.parse(req.body)
  const reservation = await prisma.reservation.create({ data: input })
  res.status(201).json({ reservation: { id: reservation.id, status: reservation.status } })
}))

export default router
