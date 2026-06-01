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

  let response

  try {
    response = await fetch(buildApiUrl(path), options)
  } catch (error) {
    throw new Error('Unable to reach the store right now. Please check your connection and try again.')
  }

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const fallbackMessage = response.status >= 500
      ? 'The store service is having trouble. Please try again in a moment.'
      : 'We could not complete that request. Please check your details and try again.'
    throw new Error(result.error || result.message || fallbackMessage)
  }

  return result
}

function withQuery(path, params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : value)
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}

export const productService = {
  getAll: (params) => apiRequest('GET', withQuery(API_PATHS.products, params)),
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
