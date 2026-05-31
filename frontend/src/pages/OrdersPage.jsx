import Orders from '../components/Orders'

export default function OrdersPage({ orders, loadUserOrders, loading, error }) {
  return (
    <Orders
      orders={orders}
      loadUserOrders={loadUserOrders}
      loading={loading}
      error={error}
    />
  )
}
