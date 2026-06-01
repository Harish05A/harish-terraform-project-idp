import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSession } from '../utils/auth'

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Ordered', color: '#2563eb', bg: '#dbeafe' },
  DISPATCHED: { label: 'Dispatched', color: '#d97706', bg: '#fef3c7' },
  DELIVERED: { label: 'Delivered', color: '#059669', bg: '#d1fae5' },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' }
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748b', bg: '#f1f5f9' }
  return (
    <span className="order-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  )
}

export default function ProfilePage({ orders, loadUserOrders, onLogout }) {
  const session = getSession()

  useEffect(() => {
    if (session?.userId) {
      loadUserOrders(session.userId)
    }
  }, [session?.userId, loadUserOrders])

  const totalOrders = orders.length
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length
  const totalSpent = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)
  const recentOrders = orders.slice(0, 5)

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">My Account</p>
          <h1 className="page-title">Profile</h1>
        </div>
      </div>

      {/* Profile card */}
      <div className="profile-card">
        <div className="profile-avatar">
          {session?.displayName?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{session?.displayName || 'Customer'}</h2>
          <p className="profile-username">@{session?.username}</p>
          <span className="role-badge role-badge--customer"><i className="fa-solid fa-bag-shopping" /> Customer</span>
        </div>
        <div className="profile-actions">
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Account stats */}
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{totalOrders}</span>
          <span className="profile-stat-label">Total Orders</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{deliveredOrders}</span>
          <span className="profile-stat-label">Delivered</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">${totalSpent.toFixed(2)}</span>
          <span className="profile-stat-label">Total Spent</span>
        </div>
      </div>

      {/* Account info */}
      <div className="profile-section">
        <h3 className="section-title">Account Information</h3>
        <div className="profile-details">
          <div className="profile-detail-row">
            <span className="detail-label">Username</span>
            <span>{session?.username}</span>
          </div>
          <div className="profile-detail-row">
            <span className="detail-label">Role</span>
            <span>Customer</span>
          </div>
          <div className="profile-detail-row">
            <span className="detail-label">User ID</span>
            <span className="mono">{session?.userId}</span>
          </div>
          <div className="profile-detail-row">
            <span className="detail-label">Member Since</span>
            <span>{session?.loginTime ? new Date(session.loginTime).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="profile-section">
        <div className="section-heading">
          <h3 className="section-title" style={{ marginBottom: 0 }}>Recent Orders</h3>
          <Link to="/orders" className="card-link">View all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            No orders yet. <Link to="/">Start shopping →</Link>
          </div>
        ) : (
          <div className="recent-orders-list">
            {recentOrders.map(order => (
              <div className="recent-order-row" key={order.order_id}>
                <div>
                  <strong>#{order.order_id.substring(0, 8)}</strong>
                  <span className="order-date-sm">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="recent-order-right">
                  <span>${parseFloat(order.total_price || 0).toFixed(2)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
