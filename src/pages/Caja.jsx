import { useMemo, useState } from 'react'
import { dateToInputValue, formatCurrency } from '../utils/formatters'

function Caja({
  cashRegister,
  sales,
  cashHistory,
  today,
  onOpenCash,
  onCloseCash,
}) {
  const [selectedDate, setSelectedDate] = useState(today)
  const dailySales = useMemo(
    () => sales.filter((sale) => dateToInputValue(new Date(sale.date)) === selectedDate),
    [sales, selectedDate],
  )
  const dailyCashSales = dailySales.reduce((total, sale) => total + Number(sale.total || 0), 0)
  const isToday = selectedDate === today
  const historicalCash = cashHistory.find((entry) => entry.date === selectedDate)
  const closedBy = isToday && !cashRegister.isOpen
    ? cashRegister.closedBy || historicalCash?.closedBy
    : historicalCash?.closedBy
  const openingAmount = isToday ? cashRegister.openingAmount : historicalCash?.openingAmount
  const expectedCash = isToday
    ? Number(cashRegister.openingAmount || 0) + dailyCashSales
    : historicalCash?.expectedAmount
  const closedToday = cashRegister.closedAt
    && dateToInputValue(new Date(cashRegister.closedAt)) === selectedDate
  const countedAmount = isToday && closedToday ? cashRegister.countedAmount : historicalCash?.countedAmount
  const cashDifference = countedAmount !== undefined && countedAmount !== ''
    ? Number(countedAmount) - Number(expectedCash || 0)
    : null

  return (
    <section className="module-page">
      <div className="module-intro"><span className="module-kicker">OPERACIÓN</span><h2>Caja</h2><p>Consulta las ventas en efectivo por día y controla la caja.</p></div>
      <div className="cash-day-filter">
        <label>Consultar día<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
      </div>
      <div className="cash-grid">
        <div className="panel">
          <div className="section-header"><div><h2>{isToday ? 'Estado actual de caja' : `Resumen de caja · ${selectedDate}`}</h2><p className="section-subtitle">{historicalCash?.number || cashRegister.number} · {isToday && cashRegister.isOpen ? `Abierta por ${cashRegister.openedBy || cashRegister.operator}` : `Cerrada por ${closedBy || historicalCash?.operator || cashRegister.operator}`}</p></div><span className={isToday && cashRegister.isOpen ? 'cash-state open' : 'cash-state closed'}>{isToday && cashRegister.isOpen ? 'Operativa' : 'Cerrada'}</span></div>
          <div className="cash-summary">
            {openingAmount !== undefined && <div><span>Dinero inicial de caja</span><strong>{formatCurrency(openingAmount)}</strong></div>}
            <div><span>Ventas en efectivo del día</span><strong>{formatCurrency(dailyCashSales)}</strong></div>
            <div><span>Ventas registradas</span><strong>{dailySales.length}</strong></div>
            {expectedCash !== undefined && <div><span>Efectivo esperado {isToday ? 'hoy' : 'ese día'}</span><strong>{formatCurrency(expectedCash)}</strong></div>}
            {countedAmount !== undefined && countedAmount !== '' && <div><span>Efectivo contado al cierre</span><strong>{formatCurrency(countedAmount)}</strong></div>}
          </div>
          {!isToday && !historicalCash && <p className="form-help">No hay un cierre de caja guardado para esta fecha; se muestran solo las ventas registradas.</p>}
          {cashDifference !== null && <div className={cashDifference === 0 ? 'cash-difference balanced' : 'cash-difference'}>Diferencia de cierre: {formatCurrency(cashDifference)}</div>}
        </div>
        <div className="panel">
          <div className="section-header"><h2>{isToday ? (cashRegister.isOpen ? 'Cerrar caja' : 'Abrir caja') : 'Operaciones de caja'}</h2></div>
          {!isToday ? (
            <p className="empty-text">Selecciona la fecha de hoy para abrir o cerrar la caja.</p>
          ) : (
            <div className="product-form">
              {cashRegister.isOpen && <p className="form-help">Al cerrar se registrará el efectivo esperado: {formatCurrency(expectedCash)}.</p>}
              <button className="primary-btn" type="button" onClick={cashRegister.isOpen ? onCloseCash : onOpenCash}>
                {cashRegister.isOpen ? 'Cerrar caja' : 'Abrir caja'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Caja
