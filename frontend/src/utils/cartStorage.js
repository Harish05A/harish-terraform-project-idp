const CART_STORAGE_KEY = 'cart'

export function loadSavedCart() {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    return savedCart ? JSON.parse(savedCart) : {}
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error)
    return {}
  }
}

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error)
  }
}

export function getCartCount(cart) {
  return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
}

export function getCartItems(cart) {
  return Object.values(cart)
}

export function getCartTotal(cart) {
  return getCartItems(cart).reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
}
