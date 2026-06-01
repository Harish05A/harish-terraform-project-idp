import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LOGIN_CREDENTIALS, login } from '../utils/auth'

export default function LoginPage({ showAlert }) {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    const didLogin = login(credentials.username.trim(), credentials.password)
    if (didLogin) {
      console.info('frontend_auth_event', { action: 'login', username: credentials.username.trim() })
      showAlert('Logged in successfully.', 'success')
      navigate('/', { replace: true })
    } else {
      showAlert('Invalid username or password.', 'error')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="login-page">
      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="section-title">Store Login</div>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={credentials.username}
            onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
            autoComplete="username"
            placeholder={LOGIN_CREDENTIALS.username}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
            autoComplete="current-password"
            placeholder={LOGIN_CREDENTIALS.password}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
