import { useMemo, useState } from 'react'
import { dateToInputValue, formatCurrency, todayIs } from '../utils/formatters'

function Ventas({ sales }) {
  const [selectedDate, setSelectedDate] = useState(todayIs())
  const dailySales = useMemo(
    () => sales.filter((sale) => dateToInputValue(new Date(sale.date)) === selectedDate),
    [sales, selectedDate],
  )
  const dailyTotal = dailySales.reduce((total, sale) => total + Number(sale.total || 0), 0)

  return (
    <section className="panel table-panel">
      <div className="section-header">
        <h2>Ventas del día</h2>
        <label>
          Fecha
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
      </div>
      <p className="daily-sales-total">Total del día: <strong>{formatCurrency(dailyTotal)}</strong> · {dailySales.length} ventas</p>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Método</th>
            </tr>
          </thead>
          <tbody>
            {dailySales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.invoiceNumber}</td>
                <td>{new Date(sale.date).toLocaleString()}</td>
                <td>{formatCurrency(sale.total)}</td>
                <td>Efectivo</td>
              </tr>
            ))}
            {!dailySales.length && <tr><td colSpan="4" className="empty-text">No hay ventas para la fecha seleccionada.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default Ventas
