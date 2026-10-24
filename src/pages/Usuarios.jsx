import { useState } from 'react'

const emptyForm = { name: '', username: '', password: '', role: 'EMPLOYEE' }

function Usuarios({ users, currentUserId, onCreateUser, onToggleUser, onUpdateUser }) {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const result = editingId
      ? onUpdateUser(editingId, form)
      : onCreateUser(form)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError('')
    setForm(emptyForm)
    setEditingId(null)
  }

  const edit = (user) => {
    setEditingId(user.id)
    setForm({ name: user.name, username: user.username, password: '', role: user.role })
    setError('')
  }

  return (
    <section className="module-page">
      <div className="module-intro"><span className="module-kicker">ADMINISTRACIÓN</span><h2>Usuarios y empleados</h2><p>Administra el acceso del equipo al sistema.</p></div>
      <div className="users-layout">
        <form className="panel product-form" onSubmit={submit}>
          <div className="section-header"><h2>{editingId ? 'Editar usuario' : 'Crear usuario'}</h2></div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Usuario<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
          <label>{editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <label>Rol<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="EMPLOYEE">Empleado</option>{editingId && form.role === 'ADMIN' && <option value="ADMIN">Administrador</option>}</select></label>
          <div className="button-row"><button className="primary-btn" type="submit">{editingId ? 'Guardar cambios' : 'Crear usuario'}</button>{editingId && <button className="ghost-btn" type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }}>Cancelar</button>}</div>
        </form>
        <section className="panel table-panel">
          <div className="section-header"><h2>Usuarios registrados</h2></div>
          <div className="table-wrapper"><table><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
            {users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.username}</td><td>{user.role === 'ADMIN' ? 'Administrador' : 'Empleado'}</td><td>{user.active ? 'Activo' : 'Inactivo'}</td><td><div className="action-buttons"><button className="ghost-btn tiny" type="button" onClick={() => edit(user)}>Editar</button>{user.id !== currentUserId && <button className="danger-btn tiny" type="button" onClick={() => onToggleUser(user.id)}>{user.active ? 'Desactivar' : 'Activar'}</button>}</div></td></tr>)}
          </tbody></table></div>
        </section>
      </div>
    </section>
  )
}

export default Usuarios
