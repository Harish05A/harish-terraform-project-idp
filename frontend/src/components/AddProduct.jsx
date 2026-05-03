import { useState } from 'react'

export default function AddProduct({ showAlert, apiCall, loadProducts }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    stock: 10,
    rating: 5,
    emoji: '📦'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const productId = `product-${Date.now()}`

    try {
      await apiCall('POST', '/product', {
        product_id: productId,
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        stock: parseInt(formData.stock),
        rating: parseFloat(formData.rating)
      })
      showAlert('Product added!', 'success')
      setFormData({
        name: '',
        price: '',
        description: '',
        stock: 10,
        rating: 5,
        emoji: '📦'
      })
      setTimeout(() => loadProducts(), 500)
    } catch (e) {}
  }

  return (
    <>
      <div className="section-title">Add New Product</div>
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
            <div className="form-group">
              <label>Icon (emoji)</label>
              <input
                type="text"
                value={formData.emoji}
                onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                maxLength="2"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Add Product
          </button>
        </form>
      </div>
    </>
  )
}
