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
const PRODUCT_PAGE_SIZE = 12

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
  const [productsPageLoading, setProductsPageLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [productsLastKey, setProductsLastKey] = useState(null)
  const [addingProductIds, setAddingProductIds] = useState({})
  const [removingProductIds, setRemovingProductIds] = useState({})
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
      setProducts((currentProducts) => (append ? [...currentProducts, ...nextProducts] : nextProducts))
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

  const addToCart = async (productId, name, price) => {
    if (!productId || Number(price) <= 0) {
      showAlert('This product cannot be added to the cart.', 'error')
      return
    }

    const currentQuantity = cart[productId]?.quantity || 0
    const nextQuantity = currentQuantity + 1
    setAddingProductIds((currentState) => ({ ...currentState, [productId]: true }))

    try {
      await cartService.addItem({
        user_id: DEFAULT_USER_ID,
        product_id: productId,
        quantity: nextQuantity
      })

      setCart((currentCart) => {
        const nextCart = { ...currentCart }

        if (productId in nextCart) {
          nextCart[productId].quantity = nextQuantity
        } else {
          nextCart[productId] = {
            product_id: productId,
            product_name: name,
            unit_price: Number(price),
            quantity: 1
          }
        }

        saveCart(nextCart)
        return nextCart
      })
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
      await cartService.removeItem(DEFAULT_USER_ID, productId)
      setCart((currentCart) => {
        const nextCart = { ...currentCart }
        delete nextCart[productId]
        saveCart(nextCart)
        return nextCart
      })
      showAlert('Cart updated', 'success')
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setRemovingProductIds((currentState) => ({ ...currentState, [productId]: false }))
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
                loadingMore={productsPageLoading}
                hasMoreProducts={Boolean(productsLastKey)}
                error={productsError}
                addToCart={addToCart}
                addingProductIds={addingProductIds}
                retryProducts={() => loadProducts()}
                loadMoreProducts={loadMoreProducts}
              />
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                removeFromCart={removeFromCart}
                removingProductIds={removingProductIds}
                showAlert={showAlert}
                setCart={setCart}
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
