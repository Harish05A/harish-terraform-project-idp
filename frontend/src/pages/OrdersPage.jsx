import { useEffect } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import { getSession } from '../utils/auth'

const STATUS_STEPS = ['CONFIRMED', 'DISPATCHED', 'DELIVERED']

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Ordered', iconClass: 'fa-solid fa-clipboard-list', color: '#2563eb', bg: '#dbeafe' },
  DISPATCHED: { label: 'Dispatched', iconClass: 'fa-solid fa-truck', color: '#d97706', bg: '#fef3c7' },
  DELIVERED: { label: 'Delivered', iconClass: 'fa-solid fa-circle-check', color: '#059669', bg: '#d1fae5' },
  CANCELLED: { label: 'Cancelled', iconClass: 'fa-solid fa-circle-xmark', color: '#dc2626', bg: '#fee2e2' }
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748b', bg: '#f1f5f9' }
  return (
    <span className="order-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      <i className={cfg.iconClass} /> {cfg.label}
    </span>
  )
}

function OrderTimeline({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="order-timeline cancelled">
        <span className="timeline-cancelled"><i className="fa-solid fa-circle-xmark" /> Order Cancelled</span>
      </div>
    )
  }

  const currentStep = STATUS_STEPS.indexOf(status)

  return (
    <div className="order-timeline">
      {STATUS_STEPS.map((step, i) => {
        const cfg = STATUS_CONFIG[step]
        const isDone = i <= currentStep
        const isActive = i === currentStep
        return (
          <div key={step} className={`timeline-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
            <div className="timeline-dot">{isDone ? <i className={cfg.iconClass} /> : '○'}</div>
            <div className="timeline-label">{cfg.label}</div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`timeline-line ${isDone && i < currentStep ? 'done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function InlineReview({ order, pendingRatings, submittedReviews, reviewSubmitting, setPendingRatings, submitReview, getOrderItems }) {
  const items = getOrderItems(order)
  if (items.length === 0) return null

  const allReviewed = items.every(item => submittedReviews[item.product_id])
  if (allReviewed) return null

  return (
    <div className="inline-review">
      <p className="inline-review-title"><i className="fa-solid fa-star" /> Rate your purchase</p>
      {items.map(item => {
        const productId = item.product_id
        const selectedRating = pendingRatings[productId] || 0
        const alreadySubmitted = submittedReviews[productId]
        const isSubmitting = reviewSubmitting[productId]

        if (alreadySubmitted) return null

        return (
          <div key={productId} className="inline-review-item">
            <span className="review-product-name">{item.product_name}</span>
            <div className="rating-picker">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= selectedRating ? 'active' : ''}`}
                  onClick={() => setPendingRatings(prev => ({ ...prev, [productId]: star }))}
                  disabled={isSubmitting}
                  aria-label={`Rate ${item.product_name} ${star} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-review-submit"
              onClick={() => submitReview(productId)}
              disabled={!selectedRating || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default function OrdersPage({
  orders,
  loadUserOrders,
  loading,
  error,
  latestOrderForReview,
  pendingRatings,
  submittedReviews,
  reviewSubmitting,
  setPendingRatings,
  submitReview,
  getOrderItems
}) {
  const session = getSession()

  useEffect(() => {
    if (session?.userId) {
      loadUserOrders(session.userId)
    }
  }, [session?.userId, loadUserOrders])

  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">My Account</p>
          <h1 className="page-title">My Orders</h1>
        </div>
        <button
          className="btn-action btn-action--secondary"
          onClick={() => loadUserOrders(session?.userId)}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <Loader message="Loading your orders..." />
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet.</p>
          <a href="/" className="card-link" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
            Start shopping →
          </a>
        </div>
      ) : (
        <div className="customer-orders-list">
          {orders.map(order => (
            <div className="customer-order-card" key={order.order_id}>
              <div className="customer-order-header">
                <div>
                  <strong className="order-id">Order #{order.order_id.substring(0, 8)}</strong>
                  <span className="order-date-sm">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="customer-order-right">
                  <span className="order-total">${parseFloat(order.total_price || 0).toFixed(2)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              <OrderTimeline status={order.status} />

              <div className="order-summary-row">
                <span>{order.total_items} item{order.total_items !== 1 ? 's' : ''}</span>
                <span><i className="fa-solid fa-location-dot" /> {order.shipping_address}</span>
                {order.estimated_delivery && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <span><i className="fa-solid fa-calendar-days" /> Est. {new Date(order.estimated_delivery).toLocaleDateString()}</span>
                )}
              </div>

              {/* Inline review for delivered orders */}
              {order.status === 'DELIVERED' && (
                <InlineReview
                  order={order}
                  pendingRatings={pendingRatings}
                  submittedReviews={submittedReviews}
                  reviewSubmitting={reviewSubmitting}
                  setPendingRatings={setPendingRatings}
                  submitReview={submitReview}
                  getOrderItems={getOrderItems}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
