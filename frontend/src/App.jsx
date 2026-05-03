import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import Products from './components/Products'
import Cart from './components/Cart'
import Orders from './components/Orders'
import Review from './components/Review'
import AddProduct from './components/AddProduct'

const API_BASE_URL = 'https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com'

function App() {
  const [activeSection, setActiveSection] = useState('products')
  const [cart, setCart] = useState({})
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [latestOrderForReview, setLatestOrderForReview] = useState(null)
  const [pendingRatings, setPendingRatings] = useState({})
  const [submittedReviews, setSubmittedReviews] = useState({})
  const [reviewSubmitting, setReviewSubmitting] = useState({})
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000)
  }

  const apiCall = async (method, path, data = null) => {
    try {
      const options = { method, headers: { 'Content-Type': 'application/json' } }
      if (data) options.body = JSON.stringify(data)
      const response = await fetch(`${API_BASE_URL}${path}`, options)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'API Error')
      return result
    } catch (error) {
      showAlert(error.message, 'error')
      throw error
    }
  }

  const loadProducts = useCallback(async () => {
    try {
      const data = await apiCall('GET', '/product')
      setProducts(data.data || [])
    } catch (e) {}
  }, [])

  const addToCart = (productId, name, price) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (productId in newCart) {
        newCart[productId].quantity += 1
      } else {
        newCart[productId] = { product_id: productId, product_name: name, unit_price: price, quantity: 1 }
      }
      localStorage.setItem('cart', JSON.stringify(newCart))
      syncCartToBackend(newCart)
      return newCart
    })
    showAlert(`${name} added to cart`, 'success')
  }

  const syncCartToBackend = async (cartItems) => {
    const userId = 'user-123'
    const items = Object.values(cartItems)
    if (items.length === 0) return
    for (const item of items) {
      try {
        await fetch(`${API_BASE_URL}/cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            product_id: item.product_id,
            quantity: item.quantity
          })
        })
      } catch (e) {
        console.error('Failed to sync cart:', e)
      }
    }
  }

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = { ...prev }
      delete newCart[productId]
      localStorage.setItem('cart', JSON.stringify(newCart))
      return newCart
    })
    fetch(`${API_BASE_URL}/cart/user-123/${productId}`, { method: 'DELETE' })
      .catch(e => console.error('Failed to remove from backend:', e))
  }

  const loadUserOrders = useCallback(async (userId) => {
    if (!userId) return
    try {
      const data = await apiCall('GET', `/order/user/${userId}`)
      setOrders(data.data || [])
    } catch (e) {
      setOrders([])
    }
  }, [])

  const submitReview = async (productId) => {
    const rating = pendingRatings[productId]
    if (!latestOrderForReview) {
      showAlert('No order is available for review yet.', 'error')
      return
    }
    if (!rating) {
      showAlert('Please select a star rating first.', 'error')
      return
    }

    setReviewSubmitting(prev => ({ ...prev, [productId]: true }))
    try {
      await apiCall('POST', `/product/${productId}/review`, {
        user_id: latestOrderForReview.user_id,
        order_id: latestOrderForReview.order_id,
        rating
      })
      setSubmittedReviews(prev => ({ ...prev, [productId]: rating }))
      showAlert('Review submitted successfully!', 'success')
      await loadProducts()
    } catch (e) {}
    setReviewSubmitting(prev => ({ ...prev, [productId]: false }))
  }

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      setCart(JSON.parse(saved))
    }
    loadProducts()
  }, [loadProducts])

  const getOrderItems = (order) => {
    if (!order || !order.items) return []
    if (Array.isArray(order.items)) return order.items
    return Object.values(order.items)
  }

  return (
    <>
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        cartCount={Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <div className="container">
        {alert.show && (
          <div className={`alert ${alert.type}`} style={{ display: 'block' }}>
            {alert.message}
          </div>
        )}

        {activeSection === 'products' && (
          <Products products={products} addToCart={addToCart} />
        )}

        {activeSection === 'cart' && (
          <Cart
            cart={cart}
            removeFromCart={removeFromCart}
            onCheckout={(orderData) => {
              setLatestOrderForReview(orderData)
              setPendingRatings({})
              setSubmittedReviews({})
              setActiveSection('review')
              setTimeout(() => loadUserOrders('user-123'), 500)
            }}
            showAlert={showAlert}
            apiCall={apiCall}
          />
        )}

        {activeSection === 'orders' && (
          <Orders
            orders={orders}
            loadUserOrders={loadUserOrders}
            getOrderItems={getOrderItems}
          />
        )}

        {activeSection === 'review' && (
          <Review
            latestOrderForReview={latestOrderForReview}
            pendingRatings={pendingRatings}
            submittedReviews={submittedReviews}
            reviewSubmitting={reviewSubmitting}
            setPendingRatings={setPendingRatings}
            submitReview={submitReview}
            getOrderItems={getOrderItems}
          />
        )}

        {activeSection === 'add' && (
          <AddProduct showAlert={showAlert} apiCall={apiCall} loadProducts={loadProducts} />
        )}
      </div>
    </>
  )
}

export default App
