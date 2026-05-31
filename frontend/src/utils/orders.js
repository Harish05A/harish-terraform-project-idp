export function getOrderItems(order) {
  if (!order || !order.items) return []
  if (Array.isArray(order.items)) return order.items
  return Object.values(order.items)
}
