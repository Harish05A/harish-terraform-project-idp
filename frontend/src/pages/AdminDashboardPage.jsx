import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Loader from '../components/Loader'
import { enrichProduct } from '../utils/productCatalog'

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Ordered', color: '#2563eb', bg: '#dbeafe' },
  DISPATCHED: { label: 'Dispatched', color: '#d97706', bg: '#fef3c7' },
  DELIVERED: { label: 'Delivered', color: '#059669', bg: '#d1fae5' },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' }
}

function StatCard({ iconClass, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="stat-icon"><i className={iconClass} /></div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748b', bg: '#f1f5f9' }
  return (
    <span className="order-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  )
}

export default function AdminDashboardPage({
  products,
  allOrders,
  allOrdersLoading,
  loadAllOrders,
  updateOrderStatus,
  showAlert
}) {
  useEffect(() => {
    loadAllOrders()
  }, [loadAllOrders])

  const stats = useMemo(() => {
    const totalRevenue = allOrders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)

    const statusCounts = allOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {})

    // Top selling products by order frequency
    const productFreq = {}
    allOrders.forEach(order => {
      const items = Array.isArray(order.items) ? order.items : Object.values(order.items || {})
      items.forEach(item => {
        const pid = item.product_id
        if (!productFreq[pid]) productFreq[pid] = { name: item.product_name, count: 0, revenue: 0 }
        productFreq[pid].count += item.quantity || 1
        productFreq[pid].revenue += parseFloat(item.total_price || 0)
      })
    })

    const topProducts = Object.entries(productFreq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)

    return { totalRevenue, statusCounts, topProducts }
  }, [allOrders])

  const recentOrders = useMemo(() => allOrders.slice(0, 8), [allOrders])

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus)
  }

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="page-actions">
          <Link to="/add-product" className="btn-action">+ Add Product</Link>
          <Link to="/admin/orders" className="btn-action btn-action--secondary">View All Orders</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          iconClass="fa-solid fa-boxes-stacked"
          label="Total Products"
          value={products.length}
          sub="In catalog"
          color="var(--primary)"
        />
        <StatCard
          iconClass="fa-solid fa-cart-shopping"
          label="Total Orders"
          value={allOrders.length}
          sub={`${stats.statusCounts.CONFIRMED || 0} pending`}
          color="#2563eb"
        />
        <StatCard
          iconClass="fa-solid fa-indian-rupee-sign"
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toFixed(2)}`}
          sub="Excluding cancelled"
          color="#059669"
        />
        <StatCard
          iconClass="fa-solid fa-truck"
          label="Dispatched"
          value={stats.statusCounts.DISPATCHED || 0}
          sub="In transit"
          color="#d97706"
        />
      </div>

      {/* Order Status Summary */}
      <div className="dashboard-row">
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Order Status Summary</h2>
          </div>
          <div className="status-summary">
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
              <div key={status} className="status-row" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <span className="status-row-label">{cfg.label}</span>
                <span className="status-row-count" style={{ color: cfg.color }}>
                  {stats.statusCounts[status] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Top Selling Products</h2>
          </div>
          {stats.topProducts.length === 0 ? (
            <div className="empty-state-sm">No sales data yet</div>
          ) : (
            <div className="top-products-list">
              {stats.topProducts.map(([pid, data], i) => (
                <div key={pid} className="top-product-row">
                  <span className="top-rank">#{i + 1}</span>
                  <span className="top-name">{data.name || pid}</span>
                  <span className="top-count">{data.count} sold</span>
                  <span className="top-revenue">₹{data.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="dashboard-card full-width">
        <div className="card-header">
          <h2 className="card-title">Recent Orders</h2>
          <Link to="/admin/orders" className="card-link">View all →</Link>
        </div>
        {allOrdersLoading ? (
          <Loader message="Loading orders..." />
        ) : recentOrders.length === 0 ? (
          <div className="empty-state">No orders yet</div>
        ) : (
          <div className="orders-table">
            <div className="orders-table-head">
              <span>Order ID</span>
              <span>Customer</span>
              <span>Date</span>
              <span>Total</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {recentOrders.map(order => (
              <div className="orders-table-row" key={order.order_id}>
                <span className="order-id-cell">#{order.order_id.substring(0, 8)}</span>
                <span>{order.user_id}</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                <span className="order-total-cell">₹{parseFloat(order.total_price || 0).toFixed(2)}</span>
                <span><StatusBadge status={order.status} /></span>
                <span>
                  <select
                    className="status-select"
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                    disabled={order.status === 'CANCELLED'}
                  >
                    <option value="CONFIRMED">Ordered</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
