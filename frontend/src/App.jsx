import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AddProduct from './components/AddProduct'
import Header from './components/Header'
import Review from './components/Review'
import { useTheme } from './hooks/useTheme'
import CartPage from './pages/CartPage'
import OrdersPage from './pages/OrdersPage'
import ProductsPage from './pages/ProductsPage'
import { cartService, orderService, productService } from './services/api'
import { getCartCount, loadSavedCart, saveCart } from './utils/cartStorage'
import { getOrderItems } from './utils/orders'

const DEFAULT_USER_ID = 'user-123'

function App() {
  const { theme, toggleTheme } = useTheme()
  const [cart, setCart] = useState(() => loadSavedCart())
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [latestOrderForReview, setLatestOrderForReview] = useState(null)
  const [pendingRatings, setPendingRatings] = useState({})
  const [submittedReviews, setSubmittedReviews] = useState({})
  const [reviewSubmitting, setReviewSubmitting] = useState({})
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000)
  }

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    setProductsError('')

    try {
      const data = await productService.getAll()
      setProducts(data.data || [])
    } catch (error) {
      setProductsError(error.message)
      showAlert(error.message, 'error')
    } finally {
      setProductsLoading(false)
    }
  }, [])

  const syncCartToBackend = async (cartItems) => {
    const items = Object.values(cartItems)
    if (items.length === 0) return

    for (const item of items) {
      try {
        await cartService.addItem({
          user_id: DEFAULT_USER_ID,
          product_id: item.product_id,
          quantity: item.quantity
        })
      } catch (error) {
        console.error('Failed to sync cart:', error)
      }
    }
  }

  const addToCart = (productId, name, price) => {
    setCart((currentCart) => {
      const nextCart = { ...currentCart }

      if (productId in nextCart) {
        nextCart[productId].quantity += 1
      } else {
        nextCart[productId] = {
          product_id: productId,
          product_name: name,
          unit_price: price,
          quantity: 1
        }
      }

      saveCart(nextCart)
      syncCartToBackend(nextCart)
      return nextCart
    })
    showAlert(`${name} added to cart`, 'success')
  }

  const removeFromCart = (productId) => {
    setCart((currentCart) => {
      const nextCart = { ...currentCart }
      delete nextCart[productId]
      saveCart(nextCart)
      return nextCart
    })

    cartService
      .removeItem(DEFAULT_USER_ID, productId)
      .catch((error) => console.error('Failed to remove from backend:', error))
  }

  const loadUserOrders = useCallback(async (userId) => {
    if (!userId) return

    setOrdersLoading(true)
    setOrdersError('')

    try {
      const data = await orderService.getByUser(userId)
      setOrders(data.data || [])
    } catch (error) {
      setOrders([])
      setOrdersError(error.message)
      showAlert(error.message, 'error')
    } finally {
      setOrdersLoading(false)
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

    setReviewSubmitting((currentState) => ({ ...currentState, [productId]: true }))

    try {
      await productService.addReview(productId, {
        user_id: latestOrderForReview.user_id,
        order_id: latestOrderForReview.order_id,
        rating
      })
      setSubmittedReviews((currentReviews) => ({ ...currentReviews, [productId]: rating }))
      showAlert('Review submitted successfully!', 'success')
      await loadProducts()
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setReviewSubmitting((currentState) => ({ ...currentState, [productId]: false }))
    }
  }

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return (
    <>
      <Header theme={theme} toggleTheme={toggleTheme} cartCount={getCartCount(cart)} />
      <div className="container">
        {alert.show && (
          <div className={`alert ${alert.type}`} style={{ display: 'block' }}>
            {alert.message}
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <ProductsPage
                products={products}
                loading={productsLoading}
                error={productsError}
                addToCart={addToCart}
              />
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                removeFromCart={removeFromCart}
                showAlert={showAlert}
                setLatestOrderForReview={setLatestOrderForReview}
                setPendingRatings={setPendingRatings}
                setSubmittedReviews={setSubmittedReviews}
                loadUserOrders={loadUserOrders}
              />
            }
          />
          <Route
            path="/orders"
            element={
              <OrdersPage
                orders={orders}
                loadUserOrders={loadUserOrders}
                loading={ordersLoading}
                error={ordersError}
              />
            }
          />
          <Route
            path="/review"
            element={
              <Review
                latestOrderForReview={latestOrderForReview}
                pendingRatings={pendingRatings}
                submittedReviews={submittedReviews}
                reviewSubmitting={reviewSubmitting}
                setPendingRatings={setPendingRatings}
                submitReview={submitReview}
                getOrderItems={getOrderItems}
              />
            }
          />
          <Route
            path="/add-product"
            element={<AddProduct showAlert={showAlert} loadProducts={loadProducts} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default App
