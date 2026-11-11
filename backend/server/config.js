import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  OWNER_ADMIN_PASSWORD: z.string().optional(),
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().url().optional(),
  ),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  WHATSAPP_PHONE: z.string().optional(),
  WHATSAPP_APIKEY: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
}).superRefine((env, context) => {
  const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL)
  const googlePartiallyConfigured = Boolean(env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_SECRET || env.GOOGLE_CALLBACK_URL)
  if (googlePartiallyConfigured && !googleConfigured) {
    context.addIssue({ code: 'custom', message: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL together.' })
  }
  const mailParts = [env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASSWORD, env.SMTP_FROM]
  if (mailParts.some(Boolean) && !mailParts.every(Boolean)) {
    context.addIssue({ code: 'custom', message: 'Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM together.' })
  }
  if (env.NODE_ENV === 'production' && (!env.FRONTEND_URL.startsWith('https://') || !env.BACKEND_URL.startsWith('https://'))) {
    context.addIssue({ code: 'custom', message: 'FRONTEND_URL and BACKEND_URL must use HTTPS in production.' })
  }
  if (env.NODE_ENV === 'production' && env.GOOGLE_CALLBACK_URL && !env.GOOGLE_CALLBACK_URL.startsWith('https://')) {
    context.addIssue({ code: 'custom', message: 'GOOGLE_CALLBACK_URL must use HTTPS in production.' })
  }
  if (env.NODE_ENV === 'production' && !env.OWNER_ADMIN_PASSWORD) {
    context.addIssue({ code: 'custom', message: 'Set OWNER_ADMIN_PASSWORD to bootstrap the owner account.' })
  }
  if (env.NODE_ENV === 'production' && env.OWNER_ADMIN_PASSWORD && (
    env.OWNER_ADMIN_PASSWORD.length < 16
    || !/[a-z]/.test(env.OWNER_ADMIN_PASSWORD)
    || !/[A-Z]/.test(env.OWNER_ADMIN_PASSWORD)
    || !/\d/.test(env.OWNER_ADMIN_PASSWORD)
    || !/[^A-Za-z0-9]/.test(env.OWNER_ADMIN_PASSWORD)
  )) {
    context.addIssue({ code: 'custom', message: 'OWNER_ADMIN_PASSWORD must be at least 16 characters and include upper/lowercase letters, a number, and a symbol.' })
  }
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid server environment:', parsed.error.issues.map((issue) => issue.message).join(' '))
  process.exit(1)
}

export const config = {
  ...parsed.data,
  OWNER_EMAIL: 'asema008@gmail.com',
  googleEnabled: Boolean(parsed.data.GOOGLE_CLIENT_ID),
  smtpEnabled: Boolean(parsed.data.SMTP_HOST && parsed.data.SMTP_USER && parsed.data.SMTP_PASSWORD && parsed.data.SMTP_FROM),
  whatsappEnabled: Boolean(parsed.data.WHATSAPP_PHONE && parsed.data.WHATSAPP_APIKEY),
  production: parsed.data.NODE_ENV === 'production',
}
