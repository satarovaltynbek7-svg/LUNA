import bcrypt from 'bcryptjs'
import { config } from './config.js'
import { prisma } from './db.js'

export async function ensureOwnerAccount() {
  if (!config.OWNER_ADMIN_PASSWORD) {
    if (config.production) throw new Error('OWNER_ADMIN_PASSWORD must be configured before production startup.')
    return
  }

  const existing = await prisma.user.findUnique({ where: { email: config.OWNER_EMAIL } })
  const passwordMatches = existing?.passwordHash
    ? await bcrypt.compare(config.OWNER_ADMIN_PASSWORD, existing.passwordHash)
    : false

  if (!existing) {
    const passwordHash = await bcrypt.hash(config.OWNER_ADMIN_PASSWORD, 12)
    await prisma.user.create({
      data: {
        fullName: 'LUNA Owner',
        email: config.OWNER_EMAIL,
        passwordHash,
        role: 'ADMIN',
      },
    })
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'ADMIN',
        ...(passwordMatches ? {} : {
          passwordHash: await bcrypt.hash(config.OWNER_ADMIN_PASSWORD, 12),
          sessionVersion: { increment: 1 },
        }),
      },
    })
  }

  await prisma.user.updateMany({
    where: { role: 'ADMIN', email: { not: config.OWNER_EMAIL } },
    data: { role: 'USER', sessionVersion: { increment: 1 } },
  })
}
