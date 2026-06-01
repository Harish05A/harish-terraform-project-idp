import { useState } from 'react'
import { productService } from '../services/api'

export default function AddProduct({ showAlert, loadProducts }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    stock: 10,
    rating: 5
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const productId = `product-${Date.now()}`

    setIsSubmitting(true)
    try {
      await productService.create({
        product_id: productId,
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        stock: parseInt(formData.stock),
        rating: parseFloat(formData.rating)
      })
      console.info('frontend_admin_event', { action: 'create_product', productId, name: formData.name })
      showAlert('Product added successfully!', 'success')
      setFormData({
        name: '',
        price: '',
        description: '',
        stock: 10,
        rating: 5
      })
      setTimeout(() => loadProducts(), 500)
    } catch (error) {
      showAlert(error.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h1 className="page-title">Add New Product</h1>
        </div>
      </div>
      <div className="form-add-product">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Price (USD)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Rating</label>
              <input
                type="number"
                value={formData.rating}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                min="0"
                max="5"
                step="0.1"
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            {isSubmitting ? 'Adding Product...' : 'Add Product'}
          </button>
        </form>
      </div>
    </>
  )
}
