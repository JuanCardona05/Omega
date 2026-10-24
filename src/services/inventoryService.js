import { decimalUnits } from '../data/storeDefaults'

export const getLowStockProducts = (products) =>
  products.filter((product) => Number(product.stock) <= Number(product.minStock ?? 10))

export const canAddQuantity = (product, quantity) => Number(quantity) <= Number(product.stock)

export const normalizeQuantity = (unit, quantity) =>
  decimalUnits.has(unit) ? Number(Number(quantity).toFixed(3)) : Number(quantity)

export const applySaleToInventory = (products, items) =>
  products.map((product) => {
    const item = items.find((entry) => entry.productId === product.id)
    return item ? { ...product, stock: Math.max(Number(product.stock) - Number(item.qty), 0) } : product
  })
