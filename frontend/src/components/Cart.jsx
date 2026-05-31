import { useState } from 'react'
import { orderService } from '../services/api'
import { getCartItems, getCartTotal } from '../utils/cartStorage'

export default function Cart({ cart, removeFromCart, onCheckout, showAlert }) {
  const [checkoutData, setCheckoutData] = useState({
    userId: 'user-123',
    email: '',
    shippingAddress: '',
    paymentMethod: 'CARD'
  })
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const count = Object.keys(cart).length
  const items = getCartItems(cart)
  const total = getCartTotal(cart)

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (count === 0) {
      showAlert('Cart is empty!', 'error')
      return
    }

    setIsCheckingOut(true)
    try {
      const orderData = {
        user_id: checkoutData.userId,
        email: checkoutData.email,
        shipping_address: checkoutData.shippingAddress,
        payment_method: checkoutData.paymentMethod
      }
      const orderResponse = await orderService.create(orderData)
      showAlert('Order placed successfully!', 'success')
      onCheckout(orderResponse.data)
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setIsCheckingOut(false)
    }
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
            {isCheckingOut ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </>
  )
}
