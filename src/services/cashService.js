export const calculateExpectedCash = (cashRegister, cashSales) =>
  Number(cashRegister.openingAmount || 0) + Number(cashSales || 0)

export const calculateCashDifference = (cashRegister, expectedCash) =>
  cashRegister.countedAmount === ''
    ? null
    : Number(cashRegister.countedAmount) - expectedCash

const toDateKey = (value) => {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getSalesForDate = (sales, date) =>
  sales
    .filter((sale) => toDateKey(sale.date) === date)
    .reduce((total, sale) => total + Number(sale.total || 0), 0)

export const rollCashRegisterToDate = (cashRegister, sales, cashHistory, today) => {
  const previousDate = cashRegister.businessDate
    || (cashRegister.closedAt && toDateKey(cashRegister.closedAt))
    || (cashRegister.openedAt && toDateKey(cashRegister.openedAt))

  if (!previousDate || previousDate >= today) {
    return { cashRegister, cashHistory, changed: false }
  }

  const dailyCashSales = getSalesForDate(sales, previousDate)
  const expectedAmount = calculateExpectedCash(cashRegister, dailyCashSales)
  const countedAmount = cashRegister.isOpen || cashRegister.countedAmount === ''
    ? expectedAmount
    : Number(cashRegister.countedAmount)
  const historyEntry = {
    date: previousDate,
    number: cashRegister.number,
    operator: cashRegister.operator,
    openedBy: cashRegister.openedBy || cashRegister.operator,
    closedBy: cashRegister.closedBy || (cashRegister.isOpen ? 'Cierre automático' : cashRegister.operator),
    openingAmount: Number(cashRegister.openingAmount || 0),
    cashSales: dailyCashSales,
    expectedAmount,
    countedAmount,
    openedAt: cashRegister.openedAt,
    closedAt: cashRegister.closedAt || new Date().toISOString(),
    automaticClose: cashRegister.isOpen,
  }
  const nextHistory = [
    ...cashHistory.filter((entry) => entry.date !== previousDate),
    historyEntry,
  ]

  return {
    cashRegister: {
      isOpen: false,
      number: cashRegister.number,
      operator: cashRegister.operator,
      openedAt: null,
      openingAmount: countedAmount,
      countedAmount: '',
      closedAt: null,
      businessDate: today,
    },
    cashHistory: nextHistory,
    changed: true,
  }
}

export const createCashHistoryEntry = (cashRegister, cashSales, countedAmount, closedBy) => {
  const expectedAmount = calculateExpectedCash(cashRegister, cashSales)
  return {
    date: cashRegister.businessDate || toDateKey(cashRegister.openedAt),
    number: cashRegister.number,
    operator: cashRegister.operator,
    openedBy: cashRegister.openedBy || cashRegister.operator,
    closedBy,
    openingAmount: Number(cashRegister.openingAmount || 0),
    cashSales: Number(cashSales || 0),
    expectedAmount,
    countedAmount: Number(countedAmount),
    openedAt: cashRegister.openedAt,
    closedAt: new Date().toISOString(),
    automaticClose: false,
  }
}

export const openCashRegister = ({ number, operator, openingAmount, businessDate }) => ({
  isOpen: true,
  number: number.trim(),
  operator: operator.trim(),
  openedBy: operator.trim(),
  closedBy: null,
  openedAt: new Date().toISOString(),
  openingAmount: Number(openingAmount || 0),
  countedAmount: '',
  closedAt: null,
  businessDate,
})

export const getSuggestedOpeningAmount = (cashRegister) => {
  if (!cashRegister.isOpen && cashRegister.countedAmount !== '') {
    return Number(cashRegister.countedAmount)
  }
  return Number(cashRegister.openingAmount || 0)
}

export const closeCashRegister = (cashRegister, countedAmount, closedBy) => ({
  ...cashRegister,
  isOpen: false,
  countedAmount: Number(countedAmount),
  closedAt: new Date().toISOString(),
  closedBy,
})
