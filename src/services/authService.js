import { apiRequest, googleLoginUrl } from './apiClient.js'

export async function registerWithEmail({ name, fullName, email, password }) {
  const result = await apiRequest('/auth/register', {
    method: 'POST',
    body: { fullName: fullName || name, email, password },
  })
  return result.user
}

export async function loginWithEmail({ email, password }) {
  const result = await apiRequest('/auth/login', { method: 'POST', body: { email, password } })
  return result.user
}

export function loginWithGoogle() {
  window.location.assign(googleLoginUrl())
}

export async function resetPassword(email) {
  return apiRequest('/auth/forgot-password', { method: 'POST', body: { email } })
}

export async function changePassword({ token, password }) {
  return apiRequest('/auth/reset-password', { method: 'POST', body: { token, password } })
}

export async function signOutUser() {
  await apiRequest('/auth/logout', { method: 'POST', body: {} })
}

export async function fetchCurrentUser(signal) {
  const result = await apiRequest('/auth/me', { signal })
  return result.user
}
