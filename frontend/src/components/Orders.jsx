import { useState } from 'react'
import ErrorMessage from './ErrorMessage'
import Loader from './Loader'

export default function Orders({ orders, loadUserOrders, loading, error }) {
  const [userId, setUserId] = useState('user-123')

  const handleLoadOrders = () => {
    loadUserOrders(userId)
  }

  return (
    <>
      <div className="section-title">Your Orders</div>
      <div className="form-group">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          style={{ maxWidth: '200px' }}
        />
        <div className="btn-row">
          <button onClick={handleLoadOrders} className="btn" style={{ width: 'auto' }}>
            Load Orders
          </button>
        </div>
      </div>
      <ErrorMessage message={error} />
      {loading ? (
        <Loader message="Loading orders..." />
      ) : orders.length === 0 ? (
        <div className="empty-state" style={{ display: orders.length === 0 ? 'block' : 'none' }}>
          No orders found
        </div>
      ) : (
        orders.map(order => (
          <div className="order-card" key={order.order_id}>
            <div className="order-header">
              <div>
                <strong>Order #{order.order_id.substring(0, 8)}</strong>
                <br />
                <small>{new Date(order.created_at).toLocaleDateString()}</small>
              </div>
              <span className={`order-status ${order.status}`}>{order.status}</span>
            </div>
            <div className="order-details">
              <p>Total: ${parseFloat(order.total_price).toFixed(2)} | Items: {order.total_items}</p>
              <p>Shipping: {order.shipping_address}</p>
            </div>
          </div>
        ))
      )}
    </>
  )
}
