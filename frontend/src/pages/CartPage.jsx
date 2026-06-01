import { useNavigate } from 'react-router-dom'
import Cart from '../components/Cart'
import { clearSavedCart } from '../utils/cartStorage'

export default function CartPage({
  cart,
  removeFromCart,
  updateCartQuantity,
  removingProductIds,
  updatingProductIds,
  showAlert,
  setCart,
  setLatestOrderForReview,
  setPendingRatings,
  setSubmittedReviews,
  loadUserOrders
}) {
  const navigate = useNavigate()

  const handleCheckout = (orderData) => {
    setCart({})
    clearSavedCart()
    setLatestOrderForReview(orderData)
    setPendingRatings({})
    setSubmittedReviews({})
    navigate('/review')
    setTimeout(() => loadUserOrders('user-123'), 500)
  }

  return (
    <Cart
      cart={cart}
      removeFromCart={removeFromCart}
      updateCartQuantity={updateCartQuantity}
      removingProductIds={removingProductIds}
      updatingProductIds={updatingProductIds}
      onCheckout={handleCheckout}
      showAlert={showAlert}
    />
  )
}
