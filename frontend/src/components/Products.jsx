import { useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import { enrichProduct, priceRanges } from '../utils/productCatalog'

export default function Products({
  products,
  cart = {},
  addToCart,
  addingProductIds = {},
  loadingMore,
  hasMoreProducts,
  loadMoreProducts
}) {
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    priceRange: 'all',
    sort: 'newest'
  })

  const enrichedProducts = useMemo(() => (products || []).map(enrichProduct), [products])
  const categories = useMemo(
    () => ['all', ...new Set(enrichedProducts.map((product) => product.category).filter(Boolean))],
    [enrichedProducts]
  )

  const visibleProducts = useMemo(() => {
    const selectedRange = priceRanges.find((range) => range.value === filters.priceRange) || priceRanges[0]
    const searchTerm = filters.search.trim().toLowerCase()

    return enrichedProducts
      .filter((product) => {
        const price = Number(product.price || 0)
        const matchesSearch = !searchTerm ||
          product.name.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm)
        const matchesCategory = filters.category === 'all' || product.category === filters.category
        const matchesPrice = price >= selectedRange.min && price <= selectedRange.max
        return matchesSearch && matchesCategory && matchesPrice
      })
      .sort((a, b) => {
        if (filters.sort === 'price-asc') return Number(a.price) - Number(b.price)
        if (filters.sort === 'price-desc') return Number(b.price) - Number(a.price)
        if (filters.sort === 'rated') return Number(b.rating_average || 0) - Number(a.rating_average || 0)
        return Number(b.createdRank || 0) - Number(a.createdRank || 0)
      })
  }, [enrichedProducts, filters])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <>
      <section className="store-hero">
        <div>
          <p className="eyebrow">Curated tech essentials</p>
          <h1>Shop smarter gear for work, play, and everyday life.</h1>
          <p className="hero-copy">
            Browse polished product picks with quick cart actions, helpful ratings, and simple filters.
          </p>
        </div>
        <div className="hero-stats" aria-label="Store highlights">
          <span><strong>{enrichedProducts.length}</strong> products</span>
          <span><strong>{Object.keys(cart).length}</strong> in cart</span>
          <span><strong>5</strong> categories</span>
        </div>
      </section>

      <section className="browse-toolbar" aria-label="Product filters">
        <div className="search-field">
          <label htmlFor="product-search">Search products</label>
          <input
            id="product-search"
            type="search"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search laptops, audio, watches..."
          />
        </div>
        <div className="filter-grid">
          <div className="form-group compact">
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={(event) => updateFilter('category', event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group compact">
            <label htmlFor="price-filter">Price</label>
            <select
              id="price-filter"
              value={filters.priceRange}
              onChange={(event) => updateFilter('priceRange', event.target.value)}
            >
              {priceRanges.map((range) => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group compact">
            <label htmlFor="sort-filter">Sort</label>
            <select
              id="sort-filter"
              value={filters.sort}
              onChange={(event) => updateFilter('sort', event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price Low to High</option>
              <option value="price-desc">Price High to Low</option>
              <option value="rated">Best Rated</option>
            </select>
          </div>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <p className="eyebrow">Featured catalog</p>
          <h2>Popular Products</h2>
        </div>
        <span>{visibleProducts.length} shown</span>
      </div>
      {visibleProducts.length === 0 ? (
        <div className="empty-state">No products match your filters</div>
      ) : (
        <div className="products-grid">
          {visibleProducts.map((product, index) => (
            <ProductCard
              key={product.product_id}
              product={product}
              cartItem={cart[product.product_id]}
              animationDelay={`${index * 0.05}s`}
              onAddToCart={addToCart}
              isAdding={Boolean(addingProductIds[product.product_id])}
            />
          ))}
        </div>
      )}
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
      <footer className="store-footer">Serverless commerce demo powered by React, AWS Lambda, API Gateway, DynamoDB, and Terraform.</footer>
    </>
  )
}
