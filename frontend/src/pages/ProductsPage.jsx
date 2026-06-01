import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import Products from '../components/Products'

export default function ProductsPage({
  products,
  cart,
  loading,
  loadingMore,
  hasMoreProducts,
  error,
  addToCart,
  addingProductIds,
  retryProducts,
  loadMoreProducts
}) {
  return (
    <>
      <ErrorMessage message={error} onRetry={retryProducts} />
      {loading ? (
        <Loader message="Loading products..." />
      ) : (
        <Products
          products={products}
          cart={cart}
          addToCart={addToCart}
          addingProductIds={addingProductIds}
          loadingMore={loadingMore}
          hasMoreProducts={hasMoreProducts}
          loadMoreProducts={loadMoreProducts}
        />
      )}
    </>
  )
}
