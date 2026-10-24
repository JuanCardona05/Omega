import { sessionStorageKey } from '../data/storeDefaults'

export const loadSession = () => {
  const saved = localStorage.getItem(sessionStorageKey)
  if (!saved) return null

  try {
    return JSON.parse(saved)
  } catch (error) {
    console.warn('La sesión guardada no es válida y será eliminada.', error)
    localStorage.removeItem(sessionStorageKey)
    return null
  }
}

export const saveSession = (session) => {
  localStorage.setItem(sessionStorageKey, JSON.stringify(session))
}

export const clearSession = () => {
  localStorage.removeItem(sessionStorageKey)
}
