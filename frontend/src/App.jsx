import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import { useTheme } from './hooks/useTheme'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import ProductsPage from './pages/ProductsPage'
import ProfilePage from './pages/ProfilePage'
import AddProductPage from './pages/AddProductPage'
import { cartService, orderService, productService } from './services/api'
import { clearSavedCart, getCartCount, loadSavedCart, normalizeApiCart, saveCart } from './utils/cartStorage'
import { getRole, getUserId, isAdmin, isCustomer, isLoggedIn, logout, onAuthChange } from './utils/auth'
import { getOrderItems } from './utils/orders'

const PRODUCT_PAGE_SIZE = 12

function App() {
  const { theme, toggleTheme } = useTheme()
  const [isAuthenticated, setIsAuthenticated] = useState(() => isLoggedIn())
  const [role, setRole] = useState(() => getRole())
  const [userId, setUserId] = useState(() => getUserId())
  const [cart, setCart] = useState(() => loadSavedCart())
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])
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
  const [allOrdersLoading, setAllOrdersLoading] = useState(false)

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3500)
  }

  const loadProducts = useCallback(async ({ append = false, lastKey = null } = {}) => {
    if (append) {
      setProductsPageLoading(true)
    } else {
      setProductsLoading(true)
    }
    setProductsError('')

    try {
      const data = await productService.getAll({ limit: PRODUCT_PAGE_SIZE, lastKey })
      const nextProducts = data.items || data.data || []
      setProducts((currentProducts) => {
        if (!append) return nextProducts
        const existingIds = new Set(currentProducts.map(p => p.product_id))
        return [...currentProducts, ...nextProducts.filter(p => !existingIds.has(p.product_id))]
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
      if (append) setProductsPageLoading(false)
      else setProductsLoading(false)
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

  const refreshCart = useCallback(async (uid) => {
    if (!uid) return
    try {
      const data = await cartService.getByUser(uid)
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
    const currentUserId = getUserId()
    setAddingProductIds((s) => ({ ...s, [productId]: true }))
    try {
      const response = await cartService.addItem({ user_id: currentUserId, product_id: productId, quantity: 1 })
      replaceCartFromApi(response.data)
      console.info('frontend_cart_event', { action: 'add_to_cart', productId, quantity: 1, userId: currentUserId })
      showAlert(`${name} added to cart`, 'success')
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setAddingProductIds((s) => ({ ...s, [productId]: false }))
    }
  }

  const removeFromCart = async (productId) => {
    const currentUserId = getUserId()
    setRemovingProductIds((s) => ({ ...s, [productId]: true }))
    try {
      const response = await cartService.removeItem(currentUserId, productId)
      replaceCartFromApi(response.data)
      console.info('frontend_cart_event', { action: 'remove_from_cart', productId, userId: currentUserId })
      showAlert('Item removed from cart', 'success')
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setRemovingProductIds((s) => ({ ...s, [productId]: false }))
    }
  }

  const updateCartQuantity = async (productId, quantity) => {
    if (quantity < 0) return
    const currentUserId = getUserId()
    setUpdatingProductIds((s) => ({ ...s, [productId]: true }))
    try {
      const response = quantity === 0
        ? await cartService.removeItem(currentUserId, productId)
        : await cartService.updateItem(currentUserId, productId, quantity)
      replaceCartFromApi(response.data)
      console.info('frontend_cart_event', { action: 'update_quantity', productId, quantity, userId: currentUserId })
      showAlert(quantity === 0 ? 'Item removed from cart.' : 'Quantity updated.', 'success')
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setUpdatingProductIds((s) => ({ ...s, [productId]: false }))
    }
  }

  const loadUserOrders = useCallback(async (uid) => {
    if (!uid) return
    setOrdersLoading(true)
    setOrdersError('')
    try {
      const data = await orderService.getByUser(uid)
      setOrders(data.data || [])
    } catch (error) {
      setOrders([])
      setOrdersError(error.message)
      showAlert(error.message, 'error')
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  const loadAllOrders = useCallback(async () => {
    setAllOrdersLoading(true)
    try {
      const data = await orderService.getAll()
      setAllOrders(data.data || [])
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setAllOrdersLoading(false)
    }
  }, [])

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus)
      console.info('frontend_admin_event', { action: 'update_order_status', orderId, newStatus })
      showAlert(`Order status updated to ${newStatus}`, 'success')
      // Refresh both admin and customer order lists
      await loadAllOrders()
      const currentUserId = getUserId()
      if (currentUserId) await loadUserOrders(currentUserId)
    } catch (error) {
      showAlert(error.message, 'error')
    }
  }

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
    setReviewSubmitting((s) => ({ ...s, [productId]: true }))
    try {
      await productService.addReview(productId, {
        user_id: latestOrderForReview.user_id,
        order_id: latestOrderForReview.order_id,
        rating
      })
      setSubmittedReviews((s) => ({ ...s, [productId]: rating }))
      showAlert('Review submitted successfully!', 'success')
      await loadProducts()
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setReviewSubmitting((s) => ({ ...s, [productId]: false }))
    }
  }

  // Sync auth state on mount and on auth events
  useEffect(() => {
    return onAuthChange(() => {
      const loggedIn = isLoggedIn()
      setIsAuthenticated(loggedIn)
      setRole(getRole())
      setUserId(getUserId())
    })
  }, [])

  // Load products on mount
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Load cart when customer logs in
  useEffect(() => {
    if (isAuthenticated && isCustomer()) {
      refreshCart(getUserId())
    }
  }, [isAuthenticated, refreshCart])

  // Load all orders when admin logs in
  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      loadAllOrders()
    }
  }, [isAuthenticated, loadAllOrders])

  // Load customer orders when customer logs in
  useEffect(() => {
    if (isAuthenticated && isCustomer()) {
      loadUserOrders(getUserId())
    }
  }, [isAuthenticated, loadUserOrders])

  const handleLogout = () => {
    logout()
    setCart({})
    clearSavedCart()
    setOrders([])
    setAllOrders([])
    setLatestOrderForReview(null)
    showAlert('Logged out successfully.', 'success')
  }

  // Route guard helpers
  const requireAuth = (element) => isAuthenticated ? element : <Navigate to="/login" replace />
  const requireAdmin = (element) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (!isAdmin()) return <Navigate to="/" replace />
    return element
  }
  const requireCustomer = (element) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (!isCustomer()) return <Navigate to="/admin" replace />
    return element
  }

  const defaultRoute = isAuthenticated
    ? (isAdmin() ? '/admin' : '/')
    : '/login'

  return (
    <>
      {isAuthenticated && (
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          cartCount={getCartCount(cart)}
          onLogout={handleLogout}
          role={role}
        />
      )}
      <div className="container">
        {alert.show && (
          <div className={`alert ${alert.type}`} style={{ display: 'block' }}>
            {alert.message}
          </div>
        )}

        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <LoginPage showAlert={showAlert} />}
          />

          {/* Customer routes */}
          <Route
            path="/"
            element={requireCustomer(
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
            element={requireCustomer(
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
                latestOrderForReview={latestOrderForReview}
                pendingRatings={pendingRatings}
                submittedReviews={submittedReviews}
                reviewSubmitting={reviewSubmitting}
                submitReview={submitReview}
                getOrderItems={getOrderItems}
              />
            )}
          />
          <Route
            path="/orders"
            element={requireCustomer(
              <OrdersPage
                orders={orders}
                loadUserOrders={loadUserOrders}
                loading={ordersLoading}
                error={ordersError}
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
            path="/profile"
            element={requireCustomer(
              <ProfilePage
                orders={orders}
                loadUserOrders={loadUserOrders}
                onLogout={handleLogout}
              />
            )}
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={requireAdmin(
              <AdminDashboardPage
                products={products}
                allOrders={allOrders}
                allOrdersLoading={allOrdersLoading}
                loadAllOrders={loadAllOrders}
                updateOrderStatus={updateOrderStatus}
                showAlert={showAlert}
              />
            )}
          />
          <Route
            path="/admin/orders"
            element={requireAdmin(
              <AdminOrdersPage
                allOrders={allOrders}
                allOrdersLoading={allOrdersLoading}
                loadAllOrders={loadAllOrders}
                updateOrderStatus={updateOrderStatus}
              />
            )}
          />
          <Route
            path="/admin/products"
            element={requireAdmin(
              <ProductsPage
                products={products}
                cart={{}}
                loading={productsLoading}
                loadingMore={productsPageLoading}
                hasMoreProducts={Boolean(productsLastKey)}
                error={productsError}
                addToCart={null}
                addingProductIds={{}}
                retryProducts={() => loadProducts()}
                loadMoreProducts={loadMoreProducts}
                isAdminView={true}
                showAlert={showAlert}
                loadProducts={loadProducts}
              />
            )}
          />
          <Route
            path="/add-product"
            element={requireAdmin(
              <AddProductPage showAlert={showAlert} loadProducts={loadProducts} />
            )}
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </Routes>
      </div>
    </>
  )
}

export default App
