import { useState } from 'react'
import { dateToInputValue, formatCurrency, todayIs } from '../utils/formatters'

const invoiceDate = (invoice) => dateToInputValue(new Date(invoice.date))

export function PublicInvoice({ invoice, business }) {
  return (
    <main className="public-invoice-page">
      <div className="invoice-preview">
        <div className="invoice-topbar">
          <div>
            <h1>{business.name}</h1>
            <p>{business.nit || 'NIT no configurado'}</p>
            <p>{business.address || 'Dirección no configurada'}</p>
          </div>
          <div className="invoice-number">
            <strong>{invoice.invoiceNumber}</strong>
            <span>{new Date(invoice.date).toLocaleString()}</span>
          </div>
        </div>
        <p><strong>Método de pago:</strong> Efectivo</p>
        <table>
          <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={`${invoice.id}-${item.productId}`}>
                <td>{item.name}</td>
                <td>{item.qty}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td>{formatCurrency(item.qty * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="invoice-summary">
          <div><span>Subtotal</span><strong>{formatCurrency(invoice.subtotal ?? invoice.total)}</strong></div>
          <div className="grand-total"><span>Total</span><strong>{formatCurrency(invoice.total)}</strong></div>
          <div><span>Recibido</span><strong>{formatCurrency(invoice.cashReceived)}</strong></div>
          <div><span>Cambio</span><strong>{formatCurrency(invoice.change)}</strong></div>
        </div>
        <div className="thank-you">{business.footer || 'Gracias por su compra'}</div>
      </div>
    </main>
  )
}

function Facturas({ sales, invoicePreview, business, notify }) {
  const [selectedDate, setSelectedDate] = useState(todayIs())
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)

  const dailyInvoices = [...sales]
    .filter((invoice) => invoiceDate(invoice) === selectedDate)
    .sort((first, second) => second.date.localeCompare(first.date))
  const activeInvoice = dailyInvoices.find((invoice) => invoice.id === selectedInvoiceId)
    || dailyInvoices.find((invoice) => invoice.id === invoicePreview?.id)
    || dailyInvoices[0]
    || null

  const downloadInvoice = () => {
    if (!activeInvoice) return

    const content = `Factura: ${activeInvoice.invoiceNumber}\nFecha: ${new Date(
      activeInvoice.date,
    ).toLocaleString()}\n\nItems:\n${activeInvoice.items
      .map((item) =>
        `- ${item.name} x${item.qty} @ ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.qty * item.unitPrice)}`,
      )
      .join('\n')}\n\nSubtotal: ${formatCurrency(activeInvoice.subtotal ?? activeInvoice.total)}\nTotal: ${formatCurrency(
      activeInvoice.total,
    )}\nMétodo de pago: Efectivo\nDinero recibido: ${formatCurrency(
      activeInvoice.cashReceived,
    )}\nCambio: ${formatCurrency(activeInvoice.change)}`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeInvoice.invoiceNumber}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const shareInvoice = async () => {
    if (!activeInvoice) return

    const summary = `Factura ${activeInvoice.invoiceNumber} por ${formatCurrency(
      activeInvoice.total,
    )}. Gracias por su compra.`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Factura', text: summary })
        return
      } catch (error) {
        console.warn('Share cancelled or unavailable', error)
      }
    }

    notify('La opción compartir no está disponible en este navegador. Puedes imprimir o descargar la factura.', 'info')
  }

  return (
    <div className="invoice-section">
      <section className="panel">
        <div className="section-header">
          <h2>Facturas del día</h2>
          <label>
            Fecha
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
        </div>

        {dailyInvoices.length ? (
          <>
            <div className="invoice-list">
              {dailyInvoices.map((invoice) => (
                <button
                  type="button"
                  key={invoice.id}
                  className={activeInvoice?.id === invoice.id ? 'invoice-list-item active' : 'invoice-list-item'}
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                >
                  <strong>{invoice.invoiceNumber}</strong>
                  <span>{new Date(invoice.date).toLocaleTimeString()}</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </button>
              ))}
            </div>

            <div className="invoice-preview">
              <div className="invoice-topbar">
                <div>
                  <h3>{business.name}</h3>
                  <p>NIT: {business.nit || 'No configurado'}</p>
                  <p>{business.address || 'Dirección no configurada'}</p>
                  <p>{business.phone || 'Teléfono no configurado'}</p>
                </div>
                <div className="invoice-number">
                  <strong>{activeInvoice.invoiceNumber}</strong>
                  <span>{new Date(activeInvoice.date).toLocaleString()}</span>
                </div>
              </div>

              <p className="invoice-payment"><strong>Método de pago:</strong> Efectivo</p>

              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Unidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {activeInvoice.items.map((item) => (
                    <tr key={`${activeInvoice.id}-${item.productId}`}>
                      <td>{item.name}</td>
                      <td>{item.qty}</td>
                      <td>{item.unit || 'Unidad'}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.qty * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-summary">
                <div><span>Subtotal</span><strong>{formatCurrency(activeInvoice.subtotal ?? activeInvoice.total)}</strong></div>
                <div className="grand-total"><span>Total</span><strong>{formatCurrency(activeInvoice.total)}</strong></div>
                <div><span>Recibido</span><strong>{formatCurrency(activeInvoice.cashReceived)}</strong></div>
                <div><span>Cambio</span><strong>{formatCurrency(activeInvoice.change)}</strong></div>
              </div>

              <div className="thank-you">{business.footer || 'Gracias por su compra'}</div>

              <div className="invoice-actions">
                <button type="button" onClick={() => window.print()}>Imprimir</button>
                <button type="button" onClick={downloadInvoice}>Descargar</button>
                <button type="button" onClick={shareInvoice}>Compartir</button>
              </div>
            </div>
          </>
        ) : (
          <p className="empty-text">No hay facturas para la fecha seleccionada.</p>
        )}
      </section>
    </div>
  )
}

export default Facturas
