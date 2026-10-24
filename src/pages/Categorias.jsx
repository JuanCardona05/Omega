import { useState } from 'react'

function Categorias({ categories, products, onCreateCategory, onDeleteCategory }) {
  const [name, setName] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (onCreateCategory(name)) setName('')
  }

  return (
    <section className="module-page">
      <div className="module-intro"><span className="module-kicker">INVENTARIO</span><h2>Categorías</h2><p>Administra las categorías usadas por tus productos.</p></div>
      <div className="panel category-panel">
        <form className="inline-form" onSubmit={handleSubmit}>
          <label>Nueva categoría<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Aseo" /></label>
          <button className="primary-btn" type="submit">Crear categoría</button>
        </form>
        <div className="category-list">
          {categories.map((category) => {
            const productCount = products.filter((product) => product.category === category).length
            return (
              <div className="category-row" key={category}>
                <strong>{category}</strong>
                <span>{productCount} producto{productCount === 1 ? '' : 's'}</span>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => {
                    const productWarning = productCount
                      ? ` Los ${productCount} productos asignados quedarán sin categoría.`
                      : ''
                    if (window.confirm(`¿Eliminar la categoría "${category}"?${productWarning}`)) {
                      onDeleteCategory(category)
                    }
                  }}
                >
                  Eliminar
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Categorias
