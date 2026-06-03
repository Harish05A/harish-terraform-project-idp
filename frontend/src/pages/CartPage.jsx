import { useState } from 'react'
import Cart from '../components/Cart'
import { clearSavedCart } from '../utils/cartStorage'
import { getSession } from '../utils/auth'
import { getOrderItems } from '../utils/orders'

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Ordered', iconClass: 'fa-solid fa-clock-rotate-left', color: '#2563eb', bg: '#dbeafe' },
  DISPATCHED: { label: 'Dispatched', iconClass: 'fa-solid fa-truck', color: '#d97706', bg: '#fef3c7' },
  DELIVERED: { label: 'Delivered', iconClass: 'fa-solid fa-circle-check', color: '#059669', bg: '#d1fae5' },
  CANCELLED: { label: 'Cancelled', iconClass: 'fa-solid fa-circle-xmark', color: '#dc2626', bg: '#fee2e2' }
}

function OrderConfirmation({
  order,
  pendingRatings,
  submittedReviews,
  reviewSubmitting,
  setPendingRatings,
  submitReview,
  onContinue
}) {
  const items = getOrderItems(order)

  return (
    <div className="order-confirmation">
      <div className="confirmation-header">
        <span className="confirmation-icon">
          <i className="fa-solid fa-circle-check" />
        </span>
        <h2>Order Placed Successfully!</h2>
        <p className="confirmation-sub">Order #{order.order_id.substring(0, 8)}</p>
      </div>

      <div className="confirmation-details">
        <div className="confirmation-row">
          <span>Total</span>
          <strong>₹{parseFloat(order.total_price || 0).toFixed(2)}</strong>
        </div>
        <div className="confirmation-row">
          <span>Shipping to</span>
          <span>{order.shipping_address}</span>
        </div>
        <div className="confirmation-row">
          <span>Est. Delivery</span>
          <span>{order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : '7 days'}</span>
        </div>
      </div>

      {items.length > 0 && (
        <div className="post-order-review">
          <h3 className="review-section-title"><i className="fa-solid fa-star" /> Rate your purchase (optional)</h3>
          {items.map(item => {
            const productId = item.product_id
            const selectedRating = pendingRatings[productId] || 0
            const alreadySubmitted = submittedReviews[productId]
            const isSubmitting = reviewSubmitting[productId]

            return (
              <div key={productId} className="inline-review-item">
                <span className="review-product-name">{item.product_name}</span>
                <div className="rating-picker">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= selectedRating ? 'active' : ''}`}
                      onClick={() => !alreadySubmitted && setPendingRatings(prev => ({ ...prev, [productId]: star }))}
                      disabled={alreadySubmitted || isSubmitting}
                      aria-label={`Rate ${item.product_name} ${star} stars`}
                    >
                      <i className="fa-solid fa-star" />
                    </button>
                  ))}
                </div>
                {alreadySubmitted ? (
                  <span className="review-submitted-msg"><i className="fa-solid fa-circle-check" /> Review submitted ({alreadySubmitted}★)</span>
                ) : (
                  <button
                    type="button"
                    className="btn-review-submit"
                    onClick={() => submitReview(productId)}
                    disabled={!selectedRating || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="confirmation-actions">
        <button className="btn-action" onClick={onContinue}>Continue Shopping</button>
        <a href="/orders" className="btn-action btn-action--secondary">View My Orders</a>
      </div>
    </div>
  )
}

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
  loadUserOrders,
  latestOrderForReview,
  pendingRatings,
  submittedReviews,
  reviewSubmitting,
  submitReview
}) {
  const session = getSession()
  const [confirmedOrder, setConfirmedOrder] = useState(null)

  const handleCheckout = (orderData) => {
    setCart({})
    clearSavedCart()
    setLatestOrderForReview(orderData)
    setPendingRatings({})
    setSubmittedReviews({})
    setConfirmedOrder(orderData)
    const userId = session?.userId
    if (userId) setTimeout(() => loadUserOrders(userId), 500)
  }

  const handleContinueShopping = () => {
    setConfirmedOrder(null)
    window.location.href = '/'
  }

  if (confirmedOrder) {
    return (
      <OrderConfirmation
        order={confirmedOrder}
        pendingRatings={pendingRatings}
        submittedReviews={submittedReviews}
        reviewSubmitting={reviewSubmitting}
        setPendingRatings={setPendingRatings}
        submitReview={submitReview}
        onContinue={handleContinueShopping}
      />
    )
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
      userId={session?.userId}
    />
  )
}
