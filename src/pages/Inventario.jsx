import { useMemo, useState } from 'react'
import { decimalUnits, emptyProductForm, measurableUnits } from '../data/storeDefaults'
import { formatCurrency } from '../utils/formatters'

function Inventario({
  products,
  categories,
  categoryOptions,
  onProductSubmit,
  onProductDelete,
}) {
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [editingProductId, setEditingProductId] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [sortBy, setSortBy] = useState('name')

  const filteredProducts = useMemo(() => {
    const searchValue = productSearch.toLowerCase().trim()

    return [...products]
      .filter((product) => {
        const matchesCategory = categoryFilter === 'Todas' || product.category === categoryFilter
        const matchesSearch =
          !searchValue ||
          product.name.toLowerCase().includes(searchValue) ||
          product.code.toLowerCase().includes(searchValue) ||
          (product.category || '').toLowerCase().includes(searchValue)

        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'priceLow':
            return a.salePrice - b.salePrice
          case 'priceHigh':
            return b.salePrice - a.salePrice
          case 'stock':
            return b.stock - a.stock
          default:
            return a.name.localeCompare(b.name)
        }
      })
  }, [products, productSearch, categoryFilter, sortBy])

  const resetProductForm = () => {
    setProductForm(emptyProductForm)
    setEditingProductId(null)
  }

  const handleProductSubmit = (event) => {
    event.preventDefault()

    const payload = {
      code: productForm.code.trim(),
      name: productForm.name.trim(),
      category: productForm.category.trim(),
      purchasePrice: Number(productForm.purchasePrice || 0),
      salePrice: Number(productForm.salePrice || 0),
      stock: Number(productForm.stock || 0),
      unit: productForm.unit.trim() || 'Unidad',
      minStock: Number(productForm.minStock || 0),
      maxStock: Number(productForm.maxStock || 0),
      description: productForm.description.trim(),
      image: productForm.image || '',
    }

    if (onProductSubmit(payload, editingProductId)) {
      resetProductForm()
    }
  }

  const editProduct = (product) => {
    setProductForm({
      code: product.code,
      name: product.name,
      category: product.category,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      stock: product.stock,
      unit: product.unit,
      minStock: product.minStock || 10,
      maxStock: product.maxStock || 100,
      description: product.description,
      image: product.image || '',
    })
    setEditingProductId(product.id)
  }

  const deleteProduct = (productId) => {
    const product = products.find((item) => item.id === productId)
    if (!product) return

    const confirmed = window.confirm(`¿Deseas eliminar ${product.name}?`)
    if (confirmed) onProductDelete(productId)
  }

  return (
    <div className="products-layout">
      <section className="panel">
        <div className="section-header">
          <h2>{editingProductId ? 'Editar producto' : 'Registrar producto e inventario'}</h2>
        </div>

        <form onSubmit={handleProductSubmit} className="product-form">
          <div className="form-grid">
            <label>
              Código
              <input
                value={productForm.code}
                onChange={(event) => setProductForm({ ...productForm, code: event.target.value.toUpperCase() })}
              />
            </label>
            <label>
              Nombre
              <input
                value={productForm.name}
                onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
              />
            </label>
            <label>
              Categoría
              <select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>
                <option value="">Selecciona una categoría</option>
                {categoryOptions.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>
              Unidad de medida
              <select value={productForm.unit} onChange={(event) => setProductForm({ ...productForm, unit: event.target.value })}>
                {measurableUnits.map((unit) => <option key={unit}>{unit}</option>)}
              </select>
            </label>
            <label>
              Precio de compra
              <input type="number" min="0" value={productForm.purchasePrice} onChange={(event) => setProductForm({ ...productForm, purchasePrice: event.target.value })} />
            </label>
            <label>
              Precio de venta
              <input type="number" min="0" value={productForm.salePrice} onChange={(event) => setProductForm({ ...productForm, salePrice: event.target.value })} />
            </label>
            <label>
              Cantidad disponible
              <input type="number" min="0" step={decimalUnits.has(productForm.unit) ? '0.001' : '1'} value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} />
            </label>
            <label>
              Stock mínimo
              <input type="number" min="0" step={decimalUnits.has(productForm.unit) ? '0.001' : '1'} value={productForm.minStock} onChange={(event) => setProductForm({ ...productForm, minStock: event.target.value })} />
            </label>
            <label>
              Stock máximo
              <input type="number" min="0" step={decimalUnits.has(productForm.unit) ? '0.001' : '1'} value={productForm.maxStock} onChange={(event) => setProductForm({ ...productForm, maxStock: event.target.value })} />
            </label>
            <label className="full-width">
              Descripción opcional
              <textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
            </label>
            <label className="full-width">
              Foto del producto
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  if (file.size > 2 * 1024 * 1024) {
                    window.alert('La imagen no puede superar los 2 MB.')
                    event.target.value = ''
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => setProductForm((current) => ({ ...current, image: String(reader.result) }))
                  reader.readAsDataURL(file)
                }}
              />
              <small className="form-help">PNG, JPG o WebP. Máximo 2 MB.</small>
              {productForm.image && (
                <span className="product-image-preview">
                  <img src={productForm.image} alt="Vista previa del producto" />
                  <button type="button" className="ghost-btn tiny" onClick={() => setProductForm((current) => ({ ...current, image: '' }))}>Quitar foto</button>
                </span>
              )}
            </label>
          </div>

          <div className="button-row">
            <button type="submit" className="primary-btn">{editingProductId ? 'Guardar cambios' : 'Crear producto'}</button>
            {editingProductId && <button type="button" className="ghost-btn" onClick={resetProductForm}>Cancelar</button>}
          </div>
        </form>
      </section>

      <section className="panel table-panel">
        <div className="section-header compact">
          <h2>Inventario y productos</h2>
          <div className="filters">
            <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Buscar por nombre, código o categoría" />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="name">Nombre</option>
              <option value="priceLow">Precio menor</option>
              <option value="priceHigh">Precio mayor</option>
              <option value="stock">Stock</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Foto</th><th>Código</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className={product.stock <= Number(product.minStock ?? 10) ? 'low-stock-row' : ''}>
                  <td>{product.image ? <img className="inventory-product-image" src={product.image} alt={`Producto ${product.name}`} /> : 'Sin foto'}</td>
                  <td>{product.code}</td>
                  <td><div className="product-name-cell"><strong>{product.name}</strong><small>{product.description}</small></div></td>
                  <td>{product.category || 'Sin categoría'}</td>
                  <td>{formatCurrency(product.salePrice)}</td>
                  <td><span className={product.stock <= Number(product.minStock ?? 10) ? 'stock-badge low' : 'stock-badge'}>{product.stock}</span></td>
                  <td>
                    <div className="action-buttons compact-actions">
                      <button type="button" className="secondary-btn" onClick={() => editProduct(product)}>Editar</button>
                      <button type="button" className="danger-btn" onClick={() => deleteProduct(product.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Inventario
