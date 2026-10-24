import { clearSession, loadSession, saveSession } from './sessionRepository'
import { can, getPermissionsForRole, permissions } from './permissions'

export const createSession = (user) => ({
  userId: user.id,
  name: user.name,
  username: user.username,
  role: user.role,
  permissions: getPermissionsForRole(user.role),
})

export const authenticate = (users, username, password) => {
  const user = users.find((entry) => entry.username.toLowerCase() === username.trim().toLowerCase())
  if (!user || user.password !== password) {
    return { ok: false, error: 'Usuario o contraseña incorrectos.' }
  }
  if (!user.active) {
    return { ok: false, error: 'El usuario está desactivado.' }
  }

  const session = createSession(user)
  saveSession(session)
  return { ok: true, session }
}

export const getValidSession = (users) => {
  const session = loadSession()
  if (!session) return null
  const user = users.find((entry) => entry.id === session.userId)
  if (!user || !user.active || !can(user, permissions.DASHBOARD_VIEW)) {
    clearSession()
    return null
  }
  return createSession(user)
}

export const logout = () => {
  clearSession()
}
