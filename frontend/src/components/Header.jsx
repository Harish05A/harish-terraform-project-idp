import { Link, NavLink } from 'react-router-dom'

export default function Header({ theme, toggleTheme, cartCount, onLogout }) {
  return (
    <header>
      <Link className="logo" to="/">
        Ecommerce Store
      </Link>
      <nav>
        <NavLink to="/">Products</NavLink>
        <NavLink to="/cart">Cart ({cartCount})</NavLink>
        <NavLink to="/orders">Orders</NavLink>
        <NavLink to="/review">Rate Order</NavLink>
        <NavLink to="/add-product">Add Product</NavLink>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button className="btn-secondary" onClick={onLogout}>
          Logout
        </button>
      </nav>
    </header>
  )
}
