export const calculateSaleTotals = (cart) => {
  const subtotal = cart.reduce((sum, item) => sum + item.qty * Number(item.salePrice || 0), 0)
  return { subtotal, total: subtotal }
}

export const createSale = ({
  cart,
  invoiceNumber,
  cashReceived,
  totals,
  createdBy,
  createdById,
}) => ({
  id: Date.now(),
  invoiceNumber,
  date: new Date().toISOString(),
  createdBy,
  createdById,
  paymentMethod: 'Efectivo',
  subtotal: totals.subtotal,
  total: totals.total,
  cashReceived: Number(cashReceived || 0),
  change: Math.max(Number(cashReceived || 0) - totals.total, 0),
  items: cart.map((item) => ({
    productId: item.productId,
    name: item.name,
    qty: item.qty,
    unitPrice: item.salePrice,
    unit: item.unit,
  })),
})
