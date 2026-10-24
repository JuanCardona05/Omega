import { formatCurrency } from '../utils/formatters'

function Dashboard({
  todaysSales,
  revenueToday,
  lowStockProducts,
  products,
}) {
  const estimatedProfit = todaysSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => {
    const product = products.find((entry) => entry.id === item.productId)
    return itemSum + ((item.unitPrice - Number(product?.purchasePrice || 0)) * item.qty)
  }, 0), 0)

  return (
    <div className="dashboard-grid">
      <div className="stat-card accent">
        <p>Ventas del día</p>
        <h3>{todaysSales.length}</h3>
        <span>{formatCurrency(revenueToday)}</span>
      </div>
      <div className="stat-card">
        <p>Total de transacciones</p>
        <h3>{todaysSales.length}</h3>
        <span>Operaciones completadas</span>
      </div>
      <div className="stat-card">
        <p>Ganancia estimada</p>
        <h3>{formatCurrency(estimatedProfit)}</h3>
        <span>Margen bruto estimado</span>
      </div>
      <div className="stat-card warning">
        <p>Inventario bajo</p>
        <h3>{lowStockProducts.length}</h3>
        <span>Productos con stock mínimo</span>
      </div>

      <section className="panel wide">
        <div className="section-header">
          <div>
            <h2>Rendimiento de ventas</h2>
            <p className="section-subtitle">Actividad del día</p>
          </div>
        </div>
        <div className="sales-overview">
          <div className="sales-total">{formatCurrency(revenueToday)}</div>
          <div className="sales-bars" aria-label="Ventas registradas">
            {todaysSales.slice(0, 8).map((sale, index) => (
              <div className="sales-bar-column" key={sale.id}>
                <div className="sales-bar" style={{ height: `${Math.max(12, Math.min(100, sale.total / Math.max(revenueToday, 1) * 100))}%` }} />
                <span>{index + 1}</span>
              </div>
            ))}
            {!todaysSales.length && <p className="empty-text">Aún no hay ventas para mostrar.</p>}
          </div>
        </div>
      </section>

      <section className="panel wide">
        <div className="section-header">
          <div>
            <h2>Alertas importantes</h2>
            <p className="section-subtitle">Requieren atención</p>
          </div>
        </div>
        <div className="low-stock-list">
          {lowStockProducts.length ? (
            lowStockProducts.map((product) => (
              <div key={product.id} className="inventory-row">
                <span>{product.name}</span>
                <strong>{product.stock} {product.unit}</strong>
              </div>
            ))
          ) : (
            <p>No hay productos con inventario bajo.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
