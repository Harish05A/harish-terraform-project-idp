import ProductCard from './ProductCard'

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
        {products.map((product, index) => (
          <ProductCard
            key={product.product_id}
            product={product}
            animationDelay={`${index * 0.05}s`}
            onAddToCart={addToCart}
          />
        ))}
      </div>
    </>
  )
}
