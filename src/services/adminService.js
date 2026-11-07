import { apiRequest } from './apiClient.js'

const request = (path, method = 'GET', body, signal) => apiRequest(`/admin/${path}`, {
  method,
  ...(body === undefined ? {} : { body }),
  signal,
})

export const fetchAdminDashboard = (signal) => request('dashboard', 'GET', undefined, signal)
export const fetchAdminMenu = (signal) => request('menu', 'GET', undefined, signal)
export const saveMenuCategory = (category, id) => request(`menu/categories${id ? `/${encodeURIComponent(id)}` : ''}`, id ? 'PATCH' : 'POST', category)
export const deleteMenuCategory = (id) => request(`menu/categories/${encodeURIComponent(id)}`, 'DELETE')
export const saveMenuItem = (item, id) => request(`menu/items${id ? `/${encodeURIComponent(id)}` : ''}`, id ? 'PATCH' : 'POST', item)
export const deleteMenuItem = (id) => request(`menu/items/${encodeURIComponent(id)}`, 'DELETE')
export const fetchAdminOrders = (page = 1, signal) => request(`orders?page=${page}`, 'GET', undefined, signal)
export const updateOrderStatus = (id, status) => request(`orders/${encodeURIComponent(id)}/status`, 'PATCH', { status })
export const fetchAdminReservations = (page = 1, signal) => request(`reservations?page=${page}`, 'GET', undefined, signal)
export const updateReservationStatus = (id, status) => request(`reservations/${encodeURIComponent(id)}/status`, 'PATCH', { status })
export const deleteReservation = (id) => request(`reservations/${encodeURIComponent(id)}`, 'DELETE')
export const fetchAdminCustomers = (page = 1, signal) => request(`customers?page=${page}`, 'GET', undefined, signal)
export const fetchAdminGallery = (signal) => request('gallery', 'GET', undefined, signal)
export const saveGalleryImage = (image, id) => request(`gallery${id ? `/${encodeURIComponent(id)}` : ''}`, id ? 'PATCH' : 'POST', image)
export const deleteGalleryImage = (id) => request(`gallery/${encodeURIComponent(id)}`, 'DELETE')
export const fetchAdminContent = (signal) => request('content', 'GET', undefined, signal)
export const saveSiteContent = (key, value) => request(`content/${encodeURIComponent(key)}`, 'PUT', { value })
export const saveBanner = (banner, id) => request(`banners${id ? `/${encodeURIComponent(id)}` : ''}`, id ? 'PATCH' : 'POST', banner)
export const deleteBanner = (id) => request(`banners/${encodeURIComponent(id)}`, 'DELETE')

export function createCustomerOrder({ items, tableNumber }) {
  return apiRequest('/orders', { method: 'POST', body: { items, tableNumber } })
}

export function submitReservation(input) {
  return apiRequest('/reservations', { method: 'POST', body: input })
}
