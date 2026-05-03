function addRating(rating) {
  let stars = ''
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="fa fa-star ${i <= rating ? 'checked' : ''}"></span>`
  }
  return stars
}

export default function Products({ products, addToCart }) {
  if (!products || products.length === 0) {
    return <div className="empty-state">No products available</div>
  }

  return (
    <>
      <div className="section-title" style={{ marginBottom: '1.5rem' }}>
        Products
      </div>
      <div className="products-grid">
        {products.map((p, i) => {
          const ratingAverage = Number(p.rating_average ?? p.rating ?? 0)
          const ratingCount = Number(p.rating_count ?? 0)
          return (
            <div className="product-card" key={p.product_id} style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="product-image">{p.name.charAt(0).toUpperCase()}</div>
              <div className="product-info">
                <div className="product-name">{p.name}</div>
                <div className="product-desc">{p.description}</div>
                <div className="product-price">${parseFloat(p.price).toFixed(2)}</div>
                <div className="product-stock">Stock: {p.stock || 0}</div>
                <div className="product-rating">
                  <span
                    className="product-rating-stars"
                    dangerouslySetInnerHTML={{ __html: addRating(ratingAverage) }}
                  />
                  <span className="product-rating-value">{ratingAverage.toFixed(1)}</span>
                  <span>({ratingCount} review{ratingCount === 1 ? '' : 's'})</span>
                </div>
                <div className="btn-row">
                  <button
                    className="btn"
                    onClick={() => addToCart(p.product_id, p.name, p.price)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
