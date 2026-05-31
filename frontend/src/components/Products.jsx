import ProductCard from './ProductCard'

export default function Products({
  products,
  addToCart,
  addingProductIds = {},
  loadingMore,
  hasMoreProducts,
  loadMoreProducts
}) {
  if (!products || products.length === 0) {
    return <div className="empty-state">No products available</div>
  }

  return (
    <>
      <div className="section-title" style={{ marginBottom: '1.5rem' }}>
        Products
      </div>
      <div className="products-grid">
        {products.map((product, index) => (
          <ProductCard
            key={product.product_id}
            product={product}
            animationDelay={`${index * 0.05}s`}
            onAddToCart={addToCart}
            isAdding={Boolean(addingProductIds[product.product_id])}
          />
        ))}
      </div>
      {hasMoreProducts && (
        <div className="load-more-row">
          <button
            type="button"
            className="btn-primary load-more-btn"
            onClick={loadMoreProducts}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </>
  )
}
