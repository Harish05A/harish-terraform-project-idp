import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../utils/auth'

export default function LoginPage({ showAlert }) {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('customer')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    // Pre-fill demo credentials for convenience
    if (role === 'admin') {
      setCredentials({ username: 'admin', password: 'admin123' })
    } else {
      setCredentials({ username: 'customer', password: 'customer123' })
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    const result = login(credentials.username.trim(), credentials.password)

    if (result.success) {
      showAlert(`Welcome! Logged in as ${result.role}.`, 'success')
      navigate(result.role === 'admin' ? '/admin' : '/', { replace: true })
    } else {
      showAlert('Invalid username or password.', 'error')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <span className="brand-mark">S</span>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>Storefront Login</h1>
          </div>
        </div>
        <p className="login-copy">Choose your role and sign in to continue.</p>

        {/* Role selector */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${selectedRole === 'customer' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('customer')}
          >
            <span className="role-icon"><i className="fa-solid fa-bag-shopping" /></span>
            <span className="role-label">Customer</span>
            <span className="role-desc">Shop & track orders</span>
          </button>
          <button
            type="button"
            className={`role-btn ${selectedRole === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('admin')}
          >
            <span className="role-icon"><i className="fa-solid fa-gear" /></span>
            <span className="role-label">Admin</span>
            <span className="role-desc">Manage store</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials((c) => ({ ...c, username: e.target.value }))}
              autoComplete="username"
              placeholder="Enter username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
              autoComplete="current-password"
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : `Sign in as ${selectedRole === 'admin' ? 'Admin' : 'Customer'}`}
          </button>
        </form>

        <div className="login-hint">
          <p><strong>Demo credentials:</strong></p>
          <p>Customer: <code>customer / customer123</code></p>
          <p>Admin: <code>admin / admin123</code></p>
        </div>
      </div>
    </div>
  )
}
