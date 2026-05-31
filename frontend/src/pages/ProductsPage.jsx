import ErrorMessage from '../components/ErrorMessage'
import Loader from '../components/Loader'
import Products from '../components/Products'

export default function ProductsPage({ products, loading, error, addToCart }) {
  return (
    <>
      <ErrorMessage message={error} />
      {loading ? (
        <Loader message="Loading products..." />
      ) : (
        <Products products={products} addToCart={addToCart} />
      )}
    </>
  )
}
