import {
  defaultBusiness,
  defaultCategories,
  defaultCashRegister,
  defaultProducts,
  defaultSales,
  defaultUsers,
  storageKey,
} from '../data/storeDefaults'
import { rollCashRegisterToDate } from './cashService'
import { todayIs } from '../utils/formatters'

const normalizeProduct = (product) => {
  const normalizedProduct = { ...product }
  delete normalizedProduct.barcode
  delete normalizedProduct.taxType
  delete normalizedProduct.taxRate
  return {
    ...normalizedProduct,
    minStock: Number(product.minStock ?? 10),
    maxStock: Number(product.maxStock ?? 100),
  }
}

const normalizeSale = (sale) => {
  const normalizedSale = { ...sale }
  delete normalizedSale.customer
  delete normalizedSale.customerDetails
  delete normalizedSale.cardDetails
  delete normalizedSale.taxableSubtotal
  delete normalizedSale.taxAmount
  delete normalizedSale.discount
  normalizedSale.paymentMethod = 'Efectivo'
  normalizedSale.items = (sale.items ?? []).map((item) => {
    const normalizedItem = { ...item }
    delete normalizedItem.taxRate
    delete normalizedItem.discountType
    delete normalizedItem.discountValue
    delete normalizedItem.discount
    return normalizedItem
  })
  return normalizedSale
}

export const loadStoreState = () => {
  const saved = localStorage.getItem(storageKey)
  if (!saved) {
    return {
      products: defaultProducts,
      sales: defaultSales,
      lastInvoiceNumber: 0,
      business: defaultBusiness,
      cashRegister: defaultCashRegister,
      cashHistory: [],
      users: defaultUsers,
      categories: defaultCategories,
    }
  }

  try {
    const parsed = JSON.parse(saved)
    const sales = (parsed.sales ?? defaultSales).map(normalizeSale)
    const latestInvoiceNumber = sales.reduce((highest, sale) => {
      const sequence = String(sale.invoiceNumber || '').match(/(\d+)$/)
      return Math.max(highest, Number(sequence?.[1] || 0))
    }, 0)
    const business = { ...defaultBusiness, ...(parsed.business ?? {}) }
    if (business.name === 'DemoMarket') business.name = 'Omega'
    const cashHistory = Array.isArray(parsed.cashHistory) ? parsed.cashHistory : []
    const cashRegister = { ...defaultCashRegister, ...(parsed.cashRegister ?? {}) }
    const rolledCash = rollCashRegisterToDate(cashRegister, sales, cashHistory, todayIs())
    return {
      products: (parsed.products ?? defaultProducts).map(normalizeProduct),
      sales,
      lastInvoiceNumber: Math.max(Number(parsed.lastInvoiceNumber || 0), latestInvoiceNumber),
      business,
      cashRegister: rolledCash.cashRegister,
      cashHistory: rolledCash.cashHistory,
      users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : defaultUsers,
      categories: Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : [...new Set((parsed.products ?? defaultProducts).map((product) => product.category).filter(Boolean))],
    }
  } catch (error) {
    console.warn('No se pudo leer la información local guardada. Se usarán datos iniciales.', error)
    return {
      products: defaultProducts,
      sales: defaultSales,
      lastInvoiceNumber: 0,
      business: defaultBusiness,
      cashRegister: defaultCashRegister,
      cashHistory: [],
      users: defaultUsers,
      categories: defaultCategories,
    }
  }
}

export const saveStoreState = (state) => {
  localStorage.setItem(storageKey, JSON.stringify(state))
}
