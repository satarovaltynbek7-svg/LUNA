import { z } from 'zod'

const uuid = z.string().uuid()

export const registerSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/\d/),
})

export const loginSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
})

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(10).max(1000),
})

export const reviewEditSchema = reviewSchema.partial().refine((value) => Object.keys(value).length > 0)

export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export function parseId(value) {
  return uuid.parse(value)
}

export const emailSchema = z.object({ email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()) })
export const resetSchema = z.object({
  token: z.string().length(64).regex(/^[a-f0-9]+$/),
  password: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/\d/),
})

const localizedText = (maxLength) => z.object({
  ru: z.string().trim().min(1).max(maxLength),
  ky: z.string().trim().min(1).max(maxLength),
  en: z.string().trim().min(1).max(maxLength),
})
const contentUrl = z.string().trim().max(2048).refine((value) => {
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}, 'Use an HTTPS URL or a same-site path.')
const slugSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const menuCategorySchema = z.object({
  slug: slugSchema.max(60),
  names: localizedText(80),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  active: z.boolean().default(true),
})
export const menuCategoryEditSchema = menuCategorySchema.partial().refine((value) => Object.keys(value).length > 0)
export const menuItemSchema = z.object({
  slug: slugSchema,
  categoryId: uuid,
  names: localizedText(100),
  descriptions: z.object({
    ru: z.string().trim().min(1).max(500),
    ky: z.string().trim().min(1).max(500),
    en: z.string().trim().min(1).max(500),
  }),
  price: z.number().int().min(1).max(1000000),
  imageUrl: contentUrl,
  isPopular: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000).default(0),
})
export const menuItemEditSchema = menuItemSchema.partial().refine((value) => Object.keys(value).length > 0)
export const orderCreateSchema = z.object({
  tableNumber: z.number().int().min(1).max(999).optional(),
  note: z.string().trim().max(500).optional(),
  items: z.array(z.object({
    itemId: slugSchema,
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(50),
})
export const orderStatusSchema = z.object({
  status: z.enum(['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
})
export const reservationCreateSchema = z.object({
  customerName: z.string().trim().min(1).max(80),
  phone: z.string().trim().regex(/^[0-9+ ]{7,18}$/),
  dateTime: z.coerce.date().refine((value) => value.getTime() >= Date.now() - 60000),
  guestCount: z.number().int().min(1).max(8),
  specialRequests: z.string().trim().max(400).optional(),
})
export const reservationStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED']),
})
export const galleryImageSchema = z.object({
  imageUrl: contentUrl,
  category: z.enum(['space', 'drinks', 'kitchen']),
  captions: localizedText(160),
  altTexts: localizedText(200),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000).default(0),
})
export const galleryImageEditSchema = galleryImageSchema.partial().refine((value) => Object.keys(value).length > 0)
const bannerInputSchema = z.object({
  titles: localizedText(100),
  messages: localizedText(300),
  imageUrl: contentUrl.optional().or(z.literal('')),
  linkUrl: contentUrl.optional().or(z.literal('')),
  active: z.boolean().default(false),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
})
const validBannerSchedule = (value) => !value.startsAt || !value.endsAt || value.startsAt < value.endsAt
const bannerScheduleMessage = {
  path: ['endsAt'],
  message: 'Banner end must be after its start.',
}
export const bannerSchema = bannerInputSchema.refine(validBannerSchedule, bannerScheduleMessage)
export const bannerEditSchema = bannerInputSchema.partial()
  .refine((value) => Object.keys(value).length > 0)
  .refine(validBannerSchedule, bannerScheduleMessage)
export const siteContentSchema = z.object({
  key: slugSchema,
  value: localizedText(500),
})
