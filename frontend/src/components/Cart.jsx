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
  showAlert
}) {
  const [checkoutData, setCheckoutData] = useState({
    userId: 'user-123',
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

    if (!checkoutData.userId.trim()) errors.userId = 'Enter a user ID.'
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
        user_id: checkoutData.userId.trim(),
        email: checkoutData.email.trim(),
        shipping_address: checkoutData.shippingAddress.trim(),
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
            <span>${item.unit_price.toFixed(2)} x {item.quantity}</span>
            <div className="quantity-controls" aria-label={`Quantity controls for ${item.product_name}`}>
              <button
                type="button"
                className="quantity-btn"
                onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                disabled={Boolean(updatingProductIds[item.product_id]) || isCheckingOut}
                title="Decrease quantity"
              >
                -
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
          <div style={{ textAlign: 'right' }}>
            <div className="cart-item-price">
              ${(item.unit_price * item.quantity).toFixed(2)}
            </div>
            <button
              className="btn-danger"
              onClick={() => removeFromCart(item.product_id)}
              disabled={Boolean(removingProductIds[item.product_id]) || isCheckingOut}
            >
              {removingProductIds[item.product_id] || updatingProductIds[item.product_id] ? 'Updating...' : 'Remove'}
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
              disabled={isCheckingOut}
              required
            />
            {formErrors.userId && <div className="field-error">{formErrors.userId}</div>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={checkoutData.email}
              onChange={(e) => setCheckoutData(prev => ({ ...prev, email: e.target.value }))}
              disabled={isCheckingOut}
              required
            />
            {formErrors.email && <div className="field-error">{formErrors.email}</div>}
          </div>
          <div className="form-group">
            <label>Shipping Address</label>
            <textarea
              rows="2"
              value={checkoutData.shippingAddress}
              onChange={(e) => setCheckoutData(prev => ({ ...prev, shippingAddress: e.target.value }))}
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
              <option value="CARD">Credit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
          {isCheckingOut && <Loader message="Placing your order..." />}
          <button type="submit" className="btn-primary" disabled={isCheckingOut}>
            {isCheckingOut ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </>
  )
}
