const DEFAULT_API_BASE_URL = 'https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')
export const API_VERSION = 'v1'
export const API_PREFIX = `/${API_VERSION}`

export const API_PATHS = {
  products: `${API_PREFIX}/products`,
  product: (productId) => `${API_PREFIX}/products/${productId}`,
  productReview: (productId) => `${API_PREFIX}/products/${productId}/review`,
  cart: `${API_PREFIX}/cart`,
  cartForUser: (userId) => `${API_PREFIX}/cart/${userId}`,
  cartItem: (userId, productId) => `${API_PREFIX}/cart/${userId}/${productId}`,
  orders: `${API_PREFIX}/orders`,
  order: (orderId) => `${API_PREFIX}/orders/${orderId}`,
  userOrders: (userId) => `${API_PREFIX}/orders/user/${userId}`
}

export const buildApiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
