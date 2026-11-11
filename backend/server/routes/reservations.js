import { Router } from 'express'
import { prisma } from '../db.js'
import { asyncHandler } from '../lib/errors.js'
import { sendWhatsApp } from '../lib/whatsapp.js'
import { sendTelegram } from '../lib/telegram.js'
import { reservationCreateSchema } from '../middleware/validation.js'

const router = Router()

router.post('/', asyncHandler(async (req, res) => {
  const input = reservationCreateSchema.parse(req.body)
  const reservation = await prisma.reservation.create({ data: input })

  // Send notifications (non-blocking)
  const date = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bishkek',
  }).format(new Date(reservation.dateTime))

  const waMsg = [
    '📅 *Новая бронь LUNA Café*',
    `🆔 #${reservation.id.slice(0, 8).toUpperCase()}`,
    `👤 ${reservation.customerName}`,
    `📞 ${reservation.phone}`,
    `🕐 ${date}`,
    `👥 Гостей: ${reservation.guestCount}`,
    reservation.specialRequests ? `📝 ${reservation.specialRequests}` : '',
  ].filter(Boolean).join('\n')

  const tgMsg = [
    '📅 <b>Новая бронь LUNA Café</b>',
    `🆔 #${reservation.id.slice(0, 8).toUpperCase()}`,
    `👤 ${reservation.customerName}`,
    `📞 ${reservation.phone}`,
    `🕐 ${date}`,
    `👥 Гостей: ${reservation.guestCount}`,
    reservation.specialRequests ? `📝 ${reservation.specialRequests}` : '',
  ].filter(Boolean).join('\n')

  sendWhatsApp(waMsg)
  sendTelegram(tgMsg)

  res.status(201).json({ reservation: { id: reservation.id, status: reservation.status } })
}))

export default router
