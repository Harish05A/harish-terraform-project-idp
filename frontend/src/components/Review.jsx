export default function Review({
  latestOrderForReview,
  pendingRatings,
  submittedReviews,
  reviewSubmitting,
  setPendingRatings,
  submitReview,
  getOrderItems
}) {
  if (!latestOrderForReview) {
    return (
      <>
        <div className="section-title">Rate Your Purchase</div>
        <div className="order-details" style={{ marginBottom: '1rem' }}>
          Choose a star rating for the products from your latest order.
        </div>
        <div className="empty-state">Place an order to rate your purchased products.</div>
        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <button onClick={() => window.location.reload()} className="btn" style={{ width: 'auto' }}>
            Go To Orders
          </button>
        </div>
      </>
    )
  }

  const items = getOrderItems(latestOrderForReview)

  if (items.length === 0) {
    return (
      <div className="empty-state">No products were found for the latest order.</div>
    )
  }

  const selectRating = (productId, rating) => {
    if (submittedReviews[productId] || reviewSubmitting[productId]) return
    setPendingRatings(prev => ({ ...prev, [productId]: rating }))
  }

  return (
    <>
      <div className="section-title">Rate Your Purchase</div>
      <div className="order-details" style={{ marginBottom: '1rem' }}>
        Order #{latestOrderForReview.order_id.substring(0, 8)} was placed successfully. Pick a star rating for each product below.
      </div>
      {items.map(item => {
        const productId = item.product_id
        const selectedRating = pendingRatings[productId] || 0
        const alreadySubmitted = submittedReviews[productId]
        const isSubmitting = reviewSubmitting[productId]

        return (
          <div className="review-card" key={productId}>
            <h3>{item.product_name}</h3>
            <p>Quantity purchased: {item.quantity}</p>
            <div className="rating-picker">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  className={`star-btn ${star <= selectedRating ? 'active' : ''}`}
                  onClick={() => selectRating(productId, star)}
                  aria-label={`Rate ${item.product_name} ${star} stars`}
                  disabled={alreadySubmitted || isSubmitting}
                >
                  <i className="fa fa-star"></i>
                </button>
              ))}
            </div>
            <div className="review-selection">
              {alreadySubmitted
                ? `Review submitted: ${alreadySubmitted} star${alreadySubmitted > 1 ? 's' : ''}`
                : selectedRating
                  ? `Selected rating: ${selectedRating} star${selectedRating > 1 ? 's' : ''}`
                  : 'No rating selected yet'}
            </div>
            <div className="btn-row">
              <button
                type="button"
                className="btn"
                style={{ width: 'auto' }}
                onClick={() => submitReview(productId)}
                disabled={alreadySubmitted || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : alreadySubmitted ? 'Submitted' : 'Submit Review'}
              </button>
            </div>
          </div>
        )
      })}
    </>
  )
}
