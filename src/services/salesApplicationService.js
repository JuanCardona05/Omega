import { applySaleToInventory } from './inventoryService'
import { createSale } from './salesService'
import { validateSale } from '../utils/validation'

const formatInvoiceNumber = (number) => `FAC-${String(number).padStart(6, '0')}`

export const finalizeSale = ({
  cart,
  cashReceived,
  saleTotals,
  cashRegister,
  products,
  lastInvoiceNumber,
  createdBy,
  createdById,
}) => {
  const saleValidationError = validateSale({
    cart,
    isCashOpen: cashRegister.isOpen,
    cashReceived,
    total: saleTotals.total,
  })

  if (saleValidationError) {
    return {
      ok: false,
      error: saleValidationError,
      shouldOpenCash: !cashRegister.isOpen,
    }
  }

  const nextInvoiceNumber = lastInvoiceNumber + 1
  const invoiceNumber = formatInvoiceNumber(nextInvoiceNumber)
  const sale = createSale({
    cart,
    invoiceNumber,
    cashReceived,
    totals: saleTotals,
    createdBy,
    createdById,
  })

  return {
    ok: true,
    sale,
    updatedProducts: applySaleToInventory(products, cart),
    nextInvoiceNumber,
  }
}
