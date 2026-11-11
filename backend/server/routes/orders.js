import { Router } from 'express'
import { prisma } from '../db.js'
import { ApiError, asyncHandler } from '../lib/errors.js'
import { sendWhatsApp } from '../lib/whatsapp.js'
import { orderCreateSchema } from '../middleware/validation.js'

const router = Router()

router.post('/', asyncHandler(async (req, res) => {
  const input = orderCreateSchema.parse(req.body)
  const requested = new Map(input.items.map((item) => [item.itemId, item.quantity]))
  if (requested.size !== input.items.length) throw new ApiError(400, 'duplicate_order_items')

  const order = await prisma.$transaction(async (transaction) => {
    const products = await transaction.menuItem.findMany({
      where: { slug: { in: [...requested.keys()] }, active: true, category: { active: true } },
      select: { id: true, slug: true, names: true, price: true },
    })
    if (products.length !== requested.size) throw new ApiError(400, 'menu_item_unavailable')
    const lines = products.map((product) => {
      const quantity = requested.get(product.slug)
      return {
        menuItemId: product.id,
        itemNames: product.names,
        unitPrice: product.price,
        quantity,
        lineTotal: product.price * quantity,
      }
    })
    const total = lines.reduce((sum, line) => sum + line.lineTotal, 0)
    if (!Number.isSafeInteger(total)) throw new ApiError(400, 'invalid_order_total')
    return transaction.cafeOrder.create({
      data: {
        tableNumber: input.tableNumber,
        note: input.note,
        total,
        lines: { create: lines },
      },
      include: { lines: true },
    })
  })

  // Send WhatsApp notification (non-blocking)
  const linesSummary = order.lines
    .map((line) => `  • ${line.itemNames?.ru || line.itemNames?.en || '—'} x${line.quantity} = ${line.lineTotal} сом`)
    .join('\n')
  const msg = [
    '🛒 *Новый заказ LUNA Café*',
    `🆔 #${order.id.slice(0, 8).toUpperCase()}`,
    input.customerName ? `👤 ${input.customerName}` : '',
    input.customerPhone ? `📞 ${input.customerPhone}` : '',
    input.address ? `📍 ${input.address}` : '',
    input.tableNumber ? `🪑 Стол №${input.tableNumber}` : '',
    '',
    linesSummary,
    '',
    `💰 Итого: ${order.total} сом`,
    input.note ? `📝 ${input.note}` : '',
  ].filter(Boolean).join('\n')

  sendWhatsApp(msg)

  res.status(201).json({ order: { id: order.id, status: order.status, total: order.total } })
}))

export default router
