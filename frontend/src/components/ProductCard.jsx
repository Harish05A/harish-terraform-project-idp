function RatingStars({ rating }) {
  return (
    <span className="product-rating-stars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`fa fa-star ${star <= rating ? 'checked' : ''}`} />
      ))}
    </span>
  )
}

export default function ProductCard({ product, cartItem, animationDelay = '0s', onAddToCart, isAdding = false }) {
  const ratingAverage = Number(product.rating_average ?? product.rating ?? 0)
  const ratingCount = Number(product.rating_count ?? 0)
  const cartQuantity = Number(cartItem?.quantity || 0)

  return (
    <div className="product-card" style={{ animationDelay }}>
      <div className="product-image">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        <span className="category-pill">{product.category}</span>
      </div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-desc">{product.description}</div>
        <div className="product-price">${parseFloat(product.price).toFixed(2)}</div>
        <div className="product-stock">Stock: {product.stock || 0}</div>
        {cartQuantity > 0 && (
          <div className="cart-status">
            <span>Added to Cart</span>
            <span className="cart-status-badge">{cartQuantity}</span>
          </div>
        )}
        <div className="product-rating">
          <RatingStars rating={ratingAverage} />
          <span className="product-rating-value">{ratingAverage.toFixed(1)}</span>
          <span>({ratingCount} review{ratingCount === 1 ? '' : 's'})</span>
        </div>
        <div className="btn-row">
          <button
            className="btn"
            onClick={() => onAddToCart(product.product_id, product.name, product.price)}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : cartQuantity > 0 ? 'Add One More' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
