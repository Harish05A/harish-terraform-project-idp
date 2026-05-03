export default function Header({ theme, toggleTheme, cartCount, activeSection, setActiveSection }) {
  return (
    <header>
      <div className="logo" onClick={() => setActiveSection('products')}>
        Ecommerce Store
      </div>
      <nav>
        <a onClick={() => setActiveSection('products')}>Products</a>
        <a onClick={() => setActiveSection('cart')}>Cart ({cartCount})</a>
        <a onClick={() => setActiveSection('orders')}>Orders</a>
        <a onClick={() => setActiveSection('review')}>Rate Order</a>
        <a onClick={() => setActiveSection('add')}>Add Product</a>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>
    </header>
  )
}
