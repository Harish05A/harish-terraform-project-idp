import { useEffect, useMemo, useState } from 'react'
import Loader from '../components/Loader'

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

function OrderItems({ items }) {
  const itemList = Array.isArray(items) ? items : Object.values(items || {})
  return (
    <div className="order-items-list">
      {itemList.map(item => (
        <div key={item.product_id} className="order-item-row">
          <span>{item.product_name}</span>
          <span>×{item.quantity}</span>
          <span>${parseFloat(item.total_price || 0).toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminOrdersPage({ allOrders, allOrdersLoading, loadAllOrders, updateOrderStatus }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    loadAllOrders()
  }, [loadAllOrders])

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch = !q ||
        order.order_id.toLowerCase().includes(q) ||
        order.user_id.toLowerCase().includes(q) ||
        (order.email || '').toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [allOrders, filterStatus, searchQuery])

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus)
  }

  const toggleExpand = (orderId) => {
    setExpandedOrder(prev => prev === orderId ? null : orderId)
  }

  return (
    <div className="admin-orders-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h1 className="page-title">Order Management</h1>
        </div>
        <button className="btn-action" onClick={loadAllOrders} disabled={allOrdersLoading}>
          {allOrdersLoading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="search-field" style={{ flex: 1 }}>
          <label htmlFor="order-search">Search orders</label>
          <input
            id="order-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, user ID, or email..."
          />
        </div>
        <div className="form-group compact" style={{ minWidth: '180px' }}>
          <label htmlFor="status-filter">Filter by status</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="CONFIRMED">Ordered</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="orders-count-bar">
        Showing <strong>{filteredOrders.length}</strong> of <strong>{allOrders.length}</strong> orders
      </div>

      {allOrdersLoading ? (
        <Loader message="Loading orders..." />
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">No orders match your filters</div>
      ) : (
        <div className="admin-orders-list">
          {filteredOrders.map(order => (
            <div className="admin-order-card" key={order.order_id}>
              <div className="admin-order-header" onClick={() => toggleExpand(order.order_id)}>
                <div className="admin-order-meta">
                  <strong className="order-id">#{order.order_id.substring(0, 8)}</strong>
                  <span className="order-user">{order.user_id}</span>
                  <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="admin-order-right">
                  <span className="order-total">${parseFloat(order.total_price || 0).toFixed(2)}</span>
                  <StatusBadge status={order.status} />
                  <select
                    className="status-select"
                    value={order.status}
                    onChange={(e) => { e.stopPropagation(); handleStatusChange(order.order_id, e.target.value) }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={order.status === 'CANCELLED'}
                  >
                    <option value="CONFIRMED">Ordered</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <span className="expand-toggle">{expandedOrder === order.order_id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedOrder === order.order_id && (
                <div className="admin-order-details">
                  <div className="order-detail-grid">
                    <div>
                      <p className="detail-label">Email</p>
                      <p>{order.email || '—'}</p>
                    </div>
                    <div>
                      <p className="detail-label">Shipping Address</p>
                      <p>{order.shipping_address}</p>
                    </div>
                    <div>
                      <p className="detail-label">Payment Method</p>
                      <p>{order.payment_method || 'CARD'}</p>
                    </div>
                    <div>
                      <p className="detail-label">Est. Delivery</p>
                      <p>{order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="detail-label" style={{ marginBottom: '0.5rem' }}>Items ({order.total_items})</p>
                    <OrderItems items={order.items} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
