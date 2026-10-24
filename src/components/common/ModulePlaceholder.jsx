function ModulePlaceholder({ module }) {
  return (
    <section className="module-page">
      <div className="module-intro">
        <span className="module-kicker">MÓDULO</span>
        <h2>{module.title}</h2>
        <p>{module.description}</p>
      </div>
      <div className="empty-state">
        <div className="empty-state-mark" aria-hidden="true">+</div>
        <h3>{module.empty}</h3>
        <p>Esta sección está preparada para integrarse con los datos reales del negocio.</p>
        <button type="button" className="primary-btn">{module.action}</button>
      </div>
    </section>
  )
}

export default ModulePlaceholder
