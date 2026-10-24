import { useMemo } from 'react'
import { formatCurrency } from '../utils/formatters'

function Reportes({ sales, products }) {
  const recentSales = useMemo(
    () => [...sales].sort((first, second) => second.date.localeCompare(first.date)),
    [sales],
  )
  const report = useMemo(() => {
    const revenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
    const units = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + Number(item.qty || 0), 0), 0)
    const productTotals = sales.flatMap((sale) => sale.items).reduce((totals, item) => {
      totals[item.name] = (totals[item.name] || 0) + Number(item.qty || 0)
      return totals
    }, {})
    const bestSeller = Object.entries(productTotals).sort((a, b) => b[1] - a[1])[0]
    return { revenue, units, bestSeller }
  }, [sales])

  return (
    <section className="module-page">
      <div className="module-intro"><span className="module-kicker">ANÁLISIS</span><h2>Reportes</h2><p>Indicadores calculados con las ventas e inventario registrados.</p></div>
      <div className="report-grid">
        <div className="stat-card accent"><p>Ventas acumuladas</p><strong>{formatCurrency(report.revenue)}</strong></div>
        <div className="stat-card"><p>Transacciones</p><strong>{sales.length}</strong></div>
        <div className="stat-card"><p>Unidades vendidas</p><strong>{report.units}</strong></div>
      </div>
      <div className="panel report-detail">
        <h3>Resumen operativo</h3>
        <p><strong>Producto más vendido:</strong> {report.bestSeller ? `${report.bestSeller[0]} (${report.bestSeller[1]} unidades)` : 'Sin ventas registradas'}</p>
        <p><strong>Productos en inventario:</strong> {products.length}</p>
        <p><strong>Stock total disponible:</strong> {products.reduce((sum, product) => sum + Number(product.stock || 0), 0)}</p>
      </div>
      <div className="panel table-panel">
        <div className="section-header"><h3>Ventas y usuarios</h3></div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Factura</th><th>Fecha</th><th>Usuario</th><th>Total</th></tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.invoiceNumber}</td>
                  <td>{new Date(sale.date).toLocaleString()}</td>
                  <td>{sale.createdBy || 'No registrado'}</td>
                  <td>{formatCurrency(sale.total)}</td>
                </tr>
              ))}
              {!recentSales.length && <tr><td colSpan="4" className="empty-text">No hay ventas registradas.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default Reportes
