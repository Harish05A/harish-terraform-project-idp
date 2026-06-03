import { useState } from 'react'
import { orderService } from '../services/api'
import { getCartItems, getCartTotal } from '../utils/cartStorage'
import Loader from './Loader'

export default function Cart({
  cart,
  removeFromCart,
  updateCartQuantity,
  removingProductIds = {},
  updatingProductIds = {},
  onCheckout,
  showAlert,
  userId = 'user-123'
}) {
  const [checkoutData, setCheckoutData] = useState({
    email: '',
    shippingAddress: '',
    paymentMethod: 'CARD'
  })
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const count = Object.keys(cart).length
  const items = getCartItems(cart)
  const total = getCartTotal(cart)

  const validateCheckout = () => {
    const errors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!checkoutData.email.trim()) {
      errors.email = 'Enter an email address.'
    } else if (!emailPattern.test(checkoutData.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }
    if (!checkoutData.shippingAddress.trim()) errors.shippingAddress = 'Enter a shipping address.'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (count === 0) {
      showAlert('Cart is empty.', 'error')
      return
    }
    if (!validateCheckout()) {
      showAlert('Please fix the checkout details.', 'error')
      return
    }

    setIsCheckingOut(true)
    try {
      const orderData = {
        user_id: userId,
        email: checkoutData.email.trim(),
        shipping_address: checkoutData.shippingAddress.trim(),
        payment_method: checkoutData.paymentMethod
      }
      console.info('frontend_order_event', { action: 'place_order', userId, itemCount: count })
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
      <div className="cart-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Shopping</p>
            <h1 className="page-title">Your Cart</h1>
          </div>
        </div>
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <a href="/" className="card-link" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
            Browse products →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Shopping</p>
          <h1 className="page-title">Your Cart</h1>
        </div>
        <span className="cart-item-count">{count} item{count !== 1 ? 's' : ''}</span>
      </div>

      <div className="cart-layout">
        <div className="cart-items-col">
          {items.map(item => (
            <div className="cart-item" key={item.product_id}>
              <div className="cart-item-info">
                <h4>{item.product_name}</h4>
                <span className="cart-item-price-unit">₹{item.unit_price.toFixed(2)} each</span>
                <div className="quantity-controls" aria-label={`Quantity controls for ${item.product_name}`}>
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                    disabled={Boolean(updatingProductIds[item.product_id]) || isCheckingOut}
                    title="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                    disabled={Boolean(updatingProductIds[item.product_id]) || isCheckingOut}
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="cart-item-right">
                <div className="cart-item-total">
                  ₹{(item.unit_price * item.quantity).toFixed(2)}
                </div>
                <button
                  className="btn-remove"
                  onClick={() => removeFromCart(item.product_id)}
                  disabled={Boolean(removingProductIds[item.product_id]) || isCheckingOut}
                >
                  {removingProductIds[item.product_id] || updatingProductIds[item.product_id] ? '...' : '✕ Remove'}
                </button>
              </div>
            </div>
          ))}

          <div className="cart-total-bar">
            <span>Subtotal ({count} item{count !== 1 ? 's' : ''})</span>
            <span className="cart-total-amount">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="checkout-col">
          <div className="checkout-form">
            <h3 className="checkout-title">Checkout</h3>
            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={checkoutData.email}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  disabled={isCheckingOut}
                  required
                />
                {formErrors.email && <div className="field-error">{formErrors.email}</div>}
              </div>
              <div className="form-group">
                <label>Shipping Address</label>
                <textarea
                  rows="3"
                  value={checkoutData.shippingAddress}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                  placeholder="123 Main St, City, Country"
                  disabled={isCheckingOut}
                  required
                />
                {formErrors.shippingAddress && <div className="field-error">{formErrors.shippingAddress}</div>}
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={checkoutData.paymentMethod}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  disabled={isCheckingOut}
                >
                  <option value="CARD">💳 Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                </select>
              </div>

              <div className="order-summary-box">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="free-shipping">Free</span>
                </div>
                <div className="summary-row summary-total">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              {isCheckingOut && <Loader message="Placing your order..." />}
              <button type="submit" className="btn-primary" disabled={isCheckingOut}>
                {isCheckingOut ? 'Placing Order...' : `Place Order · ₹${total.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
