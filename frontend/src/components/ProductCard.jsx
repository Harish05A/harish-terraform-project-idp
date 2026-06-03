function RatingStars({ rating }) {
  return (
    <span className="product-rating-stars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`fa fa-star ${star <= rating ? 'checked' : ''}`} />
      ))}
    </span>
  )
}

export default function ProductCard({
  product,
  cartItem,
  animationDelay = '0s',
  onAddToCart,
  isAdding = false,
  isAdminView = false,
  onDelete,
  isDeleting = false
}) {
  const ratingAverage = Number(product.rating_average ?? product.rating ?? 0)
  const ratingCount = Number(product.rating_count ?? 0)
  const cartQuantity = Number(cartItem?.quantity || 0)

  return (
    <div className="product-card" style={{ animationDelay }}>
      <div className="product-image">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        <span className="category-pill">{product.category}</span>
        {product.stock <= 5 && product.stock > 0 && (
          <span className="low-stock-pill">Low Stock</span>
        )}
        {product.stock === 0 && (
          <span className="out-of-stock-pill">Out of Stock</span>
        )}
      </div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-desc">{product.description}</div>
        <div className="product-price">₹{parseFloat(product.price).toFixed(2)}</div>
        <div className="product-stock">Stock: {product.stock || 0}</div>

        {!isAdminView && cartQuantity > 0 && (
          <div className="cart-status">
            <span>In Cart</span>
            <span className="cart-status-badge">{cartQuantity}</span>
          </div>
        )}

        <div className="product-rating">
          <RatingStars rating={ratingAverage} />
          <span className="product-rating-value">{ratingAverage.toFixed(1)}</span>
          <span>({ratingCount} review{ratingCount === 1 ? '' : 's'})</span>
        </div>

        <div className="btn-row">
          {isAdminView ? (
            <button
              className="btn btn-danger-outline"
              onClick={() => onDelete && onDelete(product.product_id, product.name)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : '🗑 Delete'}
            </button>
          ) : (
            <button
              className="btn"
              onClick={() => onAddToCart && onAddToCart(product.product_id, product.name, product.price)}
              disabled={isAdding || product.stock === 0}
            >
              {isAdding ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : cartQuantity > 0 ? 'Add One More' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
