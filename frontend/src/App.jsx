import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AddProduct from './components/AddProduct'
import Header from './components/Header'
import Review from './components/Review'
import { useTheme } from './hooks/useTheme'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import ProductsPage from './pages/ProductsPage'
import { cartService, orderService, productService } from './services/api'
import { clearSavedCart, getCartCount, loadSavedCart, normalizeApiCart, saveCart } from './utils/cartStorage'
import { isLoggedIn, logout, onAuthChange } from './utils/auth'
import { getOrderItems } from './utils/orders'

const DEFAULT_USER_ID = 'user-123'
const PRODUCT_PAGE_SIZE = 12

function App() {
  const { theme, toggleTheme } = useTheme()
  const [isAuthenticated, setIsAuthenticated] = useState(() => isLoggedIn())
  const [cart, setCart] = useState(() => loadSavedCart())
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [latestOrderForReview, setLatestOrderForReview] = useState(null)
  const [pendingRatings, setPendingRatings] = useState({})
  const [submittedReviews, setSubmittedReviews] = useState({})
  const [reviewSubmitting, setReviewSubmitting] = useState({})
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsPageLoading, setProductsPageLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [productsLastKey, setProductsLastKey] = useState(null)
  const [addingProductIds, setAddingProductIds] = useState({})
  const [removingProductIds, setRemovingProductIds] = useState({})
  const [updatingProductIds, setUpdatingProductIds] = useState({})
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000)
  }

  const loadProducts = useCallback(async ({ append = false, lastKey = null } = {}) => {
    if (append) {
      setProductsPageLoading(true)
    } else {
      setProductsLoading(true)
    }
    setProductsError('')

    try {
      const data = await productService.getAll({
        limit: PRODUCT_PAGE_SIZE,
        lastKey
      })
      const nextProducts = data.items || data.data || []
      setProducts((currentProducts) => {
        if (!append) return nextProducts

        const existingIds = new Set(currentProducts.map(product => product.product_id))
        const uniqueProducts = nextProducts.filter(product => !existingIds.has(product.product_id))
        return [...currentProducts, ...uniqueProducts]
      })
      setProductsLastKey(data.lastKey || null)
    } catch (error) {
      if (!append) {
        setProducts([])
        setProductsLastKey(null)
      }
      setProductsError(error.message)
      showAlert(error.message, 'error')
    } finally {
      if (append) {
        setProductsPageLoading(false)
      } else {
        setProductsLoading(false)
      }
    }
  }, [])

  const loadMoreProducts = useCallback(() => {
    if (!productsLastKey || productsPageLoading) return
    loadProducts({ append: true, lastKey: productsLastKey })
  }, [loadProducts, productsLastKey, productsPageLoading])

  const replaceCartFromApi = (apiCart) => {
    const nextCart = normalizeApiCart(apiCart)
    saveCart(nextCart)
    setCart(nextCart)
    return nextCart
  }

  const refreshCart = useCallback(async (userId = DEFAULT_USER_ID) => {
    try {
      const data = await cartService.getByUser(userId)
      replaceCartFromApi(data)
    } catch (error) {
      showAlert(error.message, 'error')
    }
  }, [])

  const addToCart = async (productId, name, price) => {
    if (!productId || Number(price) <= 0) {
      showAlert('This product cannot be added to the cart.', 'error')
      return
    }

    setAddingProductIds((currentState) => ({ ...currentState, [productId]: true }))

    try {
      const response = await cartService.addItem({
        user_id: DEFAULT_USER_ID,
        product_id: productId,
        quantity: 1
      })
      replaceCartFromApi(response.data)
      console.info('frontend_cart_event', { action: 'add_to_cart', productId, quantity: 1 })
      showAlert(`${name} added to cart`, 'success')
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setAddingProductIds((currentState) => ({ ...currentState, [productId]: false }))
    }
  }

  const removeFromCart = async (productId) => {
    setRemovingProductIds((currentState) => ({ ...currentState, [productId]: true }))

    try {
      const response = await cartService.removeItem(DEFAULT_USER_ID, productId)
      replaceCartFromApi(response.data)
      console.info('frontend_cart_event', { action: 'remove_from_cart', productId })
      showAlert('Cart updated', 'success')
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setRemovingProductIds((currentState) => ({ ...currentState, [productId]: false }))
    }
  }

  const updateCartQuantity = async (productId, quantity) => {
    if (quantity < 0) return
    setUpdatingProductIds((currentState) => ({ ...currentState, [productId]: true }))

    try {
      const response = quantity === 0
        ? await cartService.removeItem(DEFAULT_USER_ID, productId)
        : await cartService.updateItem(DEFAULT_USER_ID, productId, quantity)
      replaceCartFromApi(response.data)
      console.info('frontend_cart_event', { action: 'update_quantity', productId, quantity })
      showAlert(quantity === 0 ? 'Item removed from cart.' : 'Quantity updated.', 'success')
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setUpdatingProductIds((currentState) => ({ ...currentState, [productId]: false }))
    }
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

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart(DEFAULT_USER_ID)
    }
  }, [isAuthenticated, refreshCart])

  useEffect(() => onAuthChange(() => setIsAuthenticated(isLoggedIn())), [])

  const handleLogout = () => {
    console.info('frontend_auth_event', { action: 'logout' })
    logout()
    setCart({})
    clearSavedCart()
    showAlert('Logged out successfully.', 'success')
  }

  const requireLogin = (element) => (
    isAuthenticated ? element : <Navigate to="/login" replace />
  )

  return (
    <>
      {isAuthenticated && (
        <Header theme={theme} toggleTheme={toggleTheme} cartCount={getCartCount(cart)} onLogout={handleLogout} />
      )}
      <div className="container">
        {alert.show && (
          <div className={`alert ${alert.type}`} style={{ display: 'block' }}>
            {alert.message}
          </div>
        )}

        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage showAlert={showAlert} />}
          />
          <Route
            path="/"
            element={requireLogin(
              <ProductsPage
                products={products}
                cart={cart}
                loading={productsLoading}
                loadingMore={productsPageLoading}
                hasMoreProducts={Boolean(productsLastKey)}
                error={productsError}
                addToCart={addToCart}
                addingProductIds={addingProductIds}
                retryProducts={() => loadProducts()}
                loadMoreProducts={loadMoreProducts}
              />
            )}
          />
          <Route
            path="/cart"
            element={requireLogin(
              <CartPage
                cart={cart}
                removeFromCart={removeFromCart}
                updateCartQuantity={updateCartQuantity}
                removingProductIds={removingProductIds}
                updatingProductIds={updatingProductIds}
                showAlert={showAlert}
                setCart={setCart}
                setLatestOrderForReview={setLatestOrderForReview}
                setPendingRatings={setPendingRatings}
                setSubmittedReviews={setSubmittedReviews}
                loadUserOrders={loadUserOrders}
              />
            )}
          />
          <Route
            path="/orders"
            element={requireLogin(
              <OrdersPage
                orders={orders}
                loadUserOrders={loadUserOrders}
                loading={ordersLoading}
                error={ordersError}
              />
            )}
          />
          <Route
            path="/review"
            element={requireLogin(
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
          />
          <Route
            path="/add-product"
            element={requireLogin(<AddProduct showAlert={showAlert} loadProducts={loadProducts} />)}
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
        </Routes>
      </div>
    </>
  )
}

export default App
