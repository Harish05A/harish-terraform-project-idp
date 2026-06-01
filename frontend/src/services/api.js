import { API_PATHS, buildApiUrl } from '../config/api'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

function getRequestId() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function apiRequest(method, path, data = null) {
  const requestId = getRequestId()
  const options = {
    method,
    headers: {
      ...JSON_HEADERS,
      'x-correlation-id': requestId
    }
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  let response

  try {
    console.info('api_request', { requestId, method, path })
    response = await fetch(buildApiUrl(path), options)
  } catch (error) {
    console.error('api_request_failed', { requestId, method, path, error: error.message })
    throw new Error('Unable to reach the store right now. Please check your connection and try again.')
  }

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    console.error('api_response_error', { requestId, method, path, status: response.status, result })
    const fallbackMessage = response.status >= 500
      ? 'The store service is having trouble. Please try again in a moment.'
      : 'We could not complete that request. Please check your details and try again.'
    throw new Error(result.error || result.message || fallbackMessage)
  }

  console.info('api_response_ok', { requestId, method, path, status: response.status })

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
  getByUser: (userId) => apiRequest('GET', API_PATHS.cartForUser(userId)),
  updateItem: (userId, productId, quantity) => apiRequest('PUT', API_PATHS.cartItem(userId, productId), { quantity }),
  removeItem: (userId, productId) => apiRequest('DELETE', API_PATHS.cartItem(userId, productId)),
  clear: (userId) => apiRequest('DELETE', API_PATHS.cartForUser(userId))
}

export const orderService = {
  create: (order) => apiRequest('POST', API_PATHS.orders, order),
  getByUser: (userId) => apiRequest('GET', API_PATHS.userOrders(userId))
}
