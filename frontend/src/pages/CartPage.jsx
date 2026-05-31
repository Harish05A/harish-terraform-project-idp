import { useNavigate } from 'react-router-dom'
import Cart from '../components/Cart'

export default function CartPage({
  cart,
  removeFromCart,
  showAlert,
  setLatestOrderForReview,
  setPendingRatings,
  setSubmittedReviews,
  loadUserOrders
}) {
  const navigate = useNavigate()

  const handleCheckout = (orderData) => {
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
      onCheckout={handleCheckout}
      showAlert={showAlert}
    />
  )
}
