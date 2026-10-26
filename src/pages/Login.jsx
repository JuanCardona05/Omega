import { useState } from 'react'
import { getAdminContactUrl } from '../utils/contactLinks'

function Login({ businessName, adminEmail, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    const result = onLogin(username, password)
    if (!result.ok) setError(result.error)
    setSubmitting(false)
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand"><img className="login-brand-logo" src={`${import.meta.env.BASE_URL}omega-mark.png`} alt="" /><span>{businessName}</span></div>
        <div className="module-intro">
          <span className="module-kicker">ACCESO SEGURO</span>
          <h1>Iniciar sesión</h1>
          <p>Ingresa tus credenciales para continuar al POS.</p>
        </div>
        {error && <div className="login-error" role="alert">{error}</div>}
        <label>Usuario<input autoFocus value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></label>
        <label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
        <button className="primary-btn" type="submit" disabled={submitting}>{submitting ? 'Validando...' : 'Iniciar sesión'}</button>
        <p className="login-help">¿Necesitas acceso? Solicítalo al administrador del negocio.</p>
        <a className="contact-admin-btn" href={getAdminContactUrl(adminEmail, 'Solicitar acceso a Omega')} target="_blank" rel="noreferrer">Contactar al administrador</a>
      </form>
    </main>
  )
}

export default Login
