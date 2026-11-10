import { apiRequest } from './apiClient.js'

export async function fetchApprovedReviews({ page = 1, limit = 20, rating, sort = 'newest', signal } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort })
  if (rating) params.set('rating', String(rating))
  return apiRequest(`/reviews?${params}`, { signal })
}

export async function fetchFeaturedReviews({ page = 1, limit = 3, signal } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiRequest(`/reviews/featured?${params}`, { signal })
}

export async function fetchUserReviews({ page = 1, limit = 100, signal } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiRequest(`/reviews/my?${params}`, { signal })
}

export async function fetchAdminReviews({ page = 1, limit = 100, rating, status, signal } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (rating) params.set('rating', String(rating))
  if (status) params.set('status', status.toUpperCase())
  return apiRequest(`/admin/reviews?${params}`, { signal })
}

export async function createReview({ rating, text }) {
  return apiRequest('/reviews', { method: 'POST', body: { rating, text } })
}

export async function updateOwnReview(reviewId, changes) {
  return apiRequest(`/reviews/${encodeURIComponent(reviewId)}`, { method: 'PATCH', body: changes })
}

export async function updateModeratedReview(reviewId, changes) {
  if (changes.status === 'approved') {
    return apiRequest(`/admin/reviews/${encodeURIComponent(reviewId)}/approve`, { method: 'PATCH', body: {} })
  }
  if (changes.status === 'rejected') {
    return apiRequest(`/admin/reviews/${encodeURIComponent(reviewId)}/reject`, { method: 'PATCH', body: {} })
  }
  if (typeof changes.featured === 'boolean') {
    return apiRequest(`/admin/reviews/${encodeURIComponent(reviewId)}/featured`, {
      method: 'PATCH',
      body: { isFeatured: changes.featured },
    })
  }
  throw new Error('unsupported_moderation_action')
}

export async function deleteOwnReview(reviewId) {
  return apiRequest(`/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' })
}

export async function deleteModeratedReview(reviewId) {
  return apiRequest(`/admin/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' })
}
