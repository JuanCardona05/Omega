import { useEffect, useMemo, useState } from 'react'
import { decimalUnits } from '../data/storeDefaults'
import { canAddQuantity, normalizeQuantity } from '../services/inventoryService'
import { calculateSaleTotals } from '../services/salesService'
import { formatCurrency } from '../utils/formatters'

function NuevaVenta({ products, notify, onFinalizeSale }) {
  const [cart, setCart] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [cashReceived, setCashReceived] = useState('')

  const saleTotals = useMemo(() => calculateSaleTotals(cart), [cart])
  const changeAmount = Number(cashReceived || 0) - saleTotals.total

  const filteredProducts = useMemo(() => {
    const searchValue = productSearch.toLowerCase().trim()

    return [...products]
      .filter((product) =>
        !searchValue ||
        product.name.toLowerCase().includes(searchValue) ||
        product.code.toLowerCase().includes(searchValue) ||
        product.category.toLowerCase().includes(searchValue),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, productSearch])

  const addToCart = (product) => {
    if (Number(product.stock) <= 0) {
      notify('Este producto está agotado.', 'error')
      return
    }

    const existingItem = cart.find((item) => item.productId === product.id)
    if (existingItem) {
      if (!canAddQuantity(product, existingItem.qty + 1)) {
        notify('No puedes vender más de la cantidad disponible en stock.', 'warning')
        return
      }

      setCart((prev) =>
        prev.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item,
        ),
      )
      return
    }

    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        code: product.code,
        name: product.name,
        qty: 1,
        salePrice: product.salePrice,
        unit: product.unit,
      },
    ])
  }

  const updateCartItemQty = (productId, nextQty) => {
    const item = cart.find((entry) => entry.productId === productId)
    const product = products.find((entry) => entry.id === productId)
    if (!item || !product) return

    if (nextQty <= 0) {
      setCart((prev) => prev.filter((entry) => entry.productId !== productId))
      return
    }

    if (!canAddQuantity(product, nextQty)) {
      notify('La cantidad solicitada supera el stock disponible.', 'warning')
      return
    }

    setCart((prev) =>
      prev.map((entry) =>
        entry.productId === productId
          ? { ...entry, qty: normalizeQuantity(entry.unit, nextQty) }
          : entry,
      ),
    )
  }

  const removeCartItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  const handleFinalizeSale = () => {
    const completed = onFinalizeSale({
      cart,
      cashReceived,
      saleTotals,
    })

    if (!completed) return

    setCart([])
    setCashReceived('')
  }

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.key === 'F2') {
        event.preventDefault()
      }
      if (event.key === 'F8') {
        event.preventDefault()
        handleFinalizeSale()
      }
      if (event.key === 'Escape') {
        setCart([])
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  })

  return (
    <div className="sale-layout">
      <section className="panel">
        <div className="section-header">
          <h2>Buscar productos</h2>
        </div>

        <div className="search-box">
          <input
            autoFocus
            placeholder="Buscar por nombre, código o categoría"
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
        </div>

        <div className="product-list">
          {filteredProducts.map((product) => (
            <button type="button" key={product.id} className="product-card" onClick={() => addToCart(product)}>
              {product.image ? <img className="product-card-image" src={product.image} alt="" /> : <span className="product-card-image-placeholder" aria-hidden="true">+</span>}
              <div>
                <strong>{product.name}</strong>
                <small>{product.code} · {product.category}</small>
              </div>
              <div className="product-card-meta">
                <span>{formatCurrency(product.salePrice)}</span>
                <small>{product.stock} disp.</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="panel cart-panel">
        <div className="section-header">
          <h2>Carrito de venta</h2>
          <button type="button" className="ghost-btn" onClick={() => setCart([])}>
            Vaciar carrito
          </button>
        </div>

        <div className="cart-table">
          {cart.length ? (
            cart.map((item) => (
              <div key={item.productId} className="cart-item">
                <div>
                  <strong>{item.name}</strong>
                  <small>{formatCurrency(item.salePrice)} / {item.unit}</small>
                </div>
                <div className="cart-qty">
                  <button type="button" onClick={() => updateCartItemQty(item.productId, Math.max(0, item.qty - (decimalUnits.has(item.unit) ? 0.1 : 1)))}>-</button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => updateCartItemQty(item.productId, item.qty + (decimalUnits.has(item.unit) ? 0.1 : 1))}>+</button>
                </div>
                <div className="cart-total">{formatCurrency(item.qty * item.salePrice)}</div>
                <button type="button" className="danger-btn tiny" onClick={() => removeCartItem(item.productId)}>
                  Quitar
                </button>
              </div>
            ))
          ) : (
            <p className="empty-text">Aún no hay productos en el carrito.</p>
          )}
        </div>

        <div className="summary-box">
          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatCurrency(saleTotals.total)}</strong>
          </div>
        </div>

        <div className="payment-box">
          <strong>Método de pago: Efectivo</strong>
          <label>
            Dinero recibido
            <input
              className={cashReceived !== '' && changeAmount < 0 ? 'input-error' : ''}
              type="number"
              min="0"
              value={cashReceived}
              onChange={(event) => setCashReceived(event.target.value)}
            />
          </label>
          <div className={changeAmount < 0 ? 'summary-row total change-insufficient' : 'summary-row total'}>
            <span>Cambio</span>
            <strong>{formatCurrency(changeAmount)}</strong>
          </div>
          {cashReceived !== '' && changeAmount < 0 && (
            <p className="payment-shortage" role="alert">
              Faltan {formatCurrency(Math.abs(changeAmount))} para completar el pago.
            </p>
          )}
        </div>

        <button type="button" className="primary-btn finalize-btn" onClick={handleFinalizeSale}>
          Finalizar venta
        </button>
      </section>
    </div>
  )
}

export default NuevaVenta
