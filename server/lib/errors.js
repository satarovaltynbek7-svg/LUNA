export class ApiError extends Error {
  constructor(status, code) {
    super(code)
    this.status = status
    this.code = code
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  if (error?.message === 'cors_origin_denied') return res.status(403).json({ error: 'untrusted_request_origin' })
  if (error?.name === 'ZodError') {
    return res.status(400).json({ error: 'invalid_request', details: error.issues.map(({ path, message }) => ({ path: path.join('.'), message })) })
  }
  if (error?.code === 'P2002') {
    const target = error.meta?.target
    return res.status(409).json({ error: Array.isArray(target) && target.includes('email') ? 'email_in_use' : 'already_exists' })
  }
  if (error?.code === 'P2025') return res.status(404).json({ error: 'not_found' })
  const status = Number.isInteger(error?.status) ? error.status : 500
  if (status >= 500) console.error('Request failed:', error)
  return res.status(status).json({ error: error?.code || 'internal_error' })
}
