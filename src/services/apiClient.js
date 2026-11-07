const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  let response
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    const error = new Error('api_unavailable')
    error.code = 'api_unavailable'
    throw error
  }
  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || 'request_failed')
    error.code = payload.error || 'request_failed'
    error.status = response.status
    throw error
  }
  return payload
}

export function googleLoginUrl() {
  return `${apiBase}/auth/google`
}
