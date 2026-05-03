import { useState } from 'react'

export default function Cart({ cart, removeFromCart, onCheckout, showAlert, apiCall }) {
  const [checkoutData, setCheckoutData] = useState({
    userId: 'user-123',
    email: '',
    shippingAddress: '',
    paymentMethod: 'CARD'
  })

  const count = Object.keys(cart).length
  const items = Object.values(cart)
  const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (count === 0) {
      showAlert('Cart is empty!', 'error')
      return
    }

    try {
      const orderData = {
        user_id: checkoutData.userId,
        email: checkoutData.email,
        shipping_address: checkoutData.shippingAddress,
        payment_method: checkoutData.paymentMethod
      }
      const orderResponse = await apiCall('POST', '/order', orderData)
      showAlert('Order placed successfully!', 'success')
      onCheckout(orderResponse.data)
    } catch (e) {}
  }

  if (count === 0) {
    return (
      <>
        <div className="section-title">Your Cart</div>
        <div className="empty-state">Your cart is empty</div>
      </>
    )
  }

  return (
    <>
      <div className="section-title">Your Cart</div>
      {items.map(item => (
        <div className="cart-item" key={item.product_id}>
          <div className="cart-item-info">
            <h4>{item.product_name}</h4>
            <span>${item.unit_price.toFixed(2)} × {item.quantity}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="cart-item-price">
              ${(item.unit_price * item.quantity).toFixed(2)}
            </div>
            <button className="btn-danger" onClick={() => removeFromCart(item.product_id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="cart-total">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
      <div className="checkout-form">
        <div className="section-title">Checkout</div>
        <form onSubmit={handleCheckout}>
          <div className="form-group">
            <label>User ID</label>
            <input
              type="text"
              value={checkoutData.userId}
              onChange={(e) => setCheckoutData(prev => ({ ...prev, userId: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={checkoutData.email}
              onChange={(e) => setCheckoutData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Shipping Address</label>
            <textarea
              rows="2"
              value={checkoutData.shippingAddress}
              onChange={(e) => setCheckoutData(prev => ({ ...prev, shippingAddress: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select
              value={checkoutData.paymentMethod}
              onChange={(e) => setCheckoutData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            >
              <option value="CARD">Credit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Place Order
          </button>
        </form>
      </div>
    </>
  )
}
