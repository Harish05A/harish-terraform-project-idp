import { API_PATHS, buildApiUrl } from '../config/api'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export async function apiRequest(method, path, data = null) {
  const options = {
    method,
    headers: JSON_HEADERS
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  const response = await fetch(buildApiUrl(path), options)
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.error || result.message || 'API request failed')
  }

  return result
}

export const productService = {
  getAll: () => apiRequest('GET', API_PATHS.products),
  create: (product) => apiRequest('POST', API_PATHS.products, product),
  addReview: (productId, review) => apiRequest('POST', API_PATHS.productReview(productId), review)
}

export const cartService = {
  addItem: (item) => apiRequest('POST', API_PATHS.cart, item),
  removeItem: (userId, productId) => apiRequest('DELETE', API_PATHS.cartItem(userId, productId))
}

export const orderService = {
  create: (order) => apiRequest('POST', API_PATHS.orders, order),
  getByUser: (userId) => apiRequest('GET', API_PATHS.userOrders(userId))
}
