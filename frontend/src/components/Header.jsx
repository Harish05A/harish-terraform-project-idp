import { Link, NavLink } from 'react-router-dom'
import { getDisplayName } from '../utils/auth'

export default function Header({ theme, toggleTheme, cartCount, onLogout, role }) {
  const displayName = getDisplayName()

  return (
    <header>
      <Link className="logo" to={role === 'admin' ? '/admin' : '/'}>
        <span className="logo-mark">S</span>
        Serverless Store
      </Link>

      <nav>
        {role === 'customer' && (
          <>
            <NavLink to="/"><i className="fa-solid fa-store nav-icon" />Products</NavLink>
            <NavLink to="/cart" className="cart-link">
              <i className="fa-solid fa-cart-shopping nav-icon" />Cart
              {cartCount > 0 && <span className="nav-count">{cartCount}</span>}
            </NavLink>
            <NavLink to="/orders"><i className="fa-solid fa-box nav-icon" />My Orders</NavLink>
            <NavLink to="/profile"><i className="fa-solid fa-user nav-icon" />Profile</NavLink>
          </>
        )}

        {role === 'admin' && (
          <>
            <NavLink to="/admin"><i className="fa-solid fa-gauge nav-icon" />Dashboard</NavLink>
            <NavLink to="/admin/orders"><i className="fa-solid fa-list-check nav-icon" />Orders</NavLink>
            <NavLink to="/admin/products"><i className="fa-solid fa-boxes-stacked nav-icon" />Products</NavLink>
            <NavLink to="/add-product"><i className="fa-solid fa-plus nav-icon" />Add Product</NavLink>
          </>
        )}

        <div className="nav-user">
          <span className={`role-badge role-badge--${role}`}>
            {role === 'admin'
              ? <><i className="fa-solid fa-shield-halved" /> Admin</>
              : <><i className="fa-solid fa-user-tag" /> Customer</>}
          </span>
          {displayName && <span className="nav-username">{displayName}</span>}
        </div>

        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark'
            ? <i className="fa-solid fa-sun" />
            : <i className="fa-solid fa-moon" />}
        </button>
        <button className="btn-logout" onClick={onLogout}>
          <i className="fa-solid fa-right-from-bracket" /> Logout
        </button>
      </nav>
    </header>
  )
}
