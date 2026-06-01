const AUTH_STORAGE_KEY = 'session'
const LOGIN_EVENT = 'auth-state-changed'

// Hardcoded credentials — frontend-only auth, no backend service
export const CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123', role: 'admin', userId: 'admin-001', displayName: 'Admin' },
  customer: { username: 'customer', password: 'customer123', role: 'customer', userId: 'user-123', displayName: 'Customer' }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore storage errors
  }
}

export function getSession() {
  return loadSession()
}

export function isLoggedIn() {
  return loadSession() !== null
}

export function getRole() {
  return loadSession()?.role || null
}

export function getUserId() {
  return loadSession()?.userId || null
}

export function getDisplayName() {
  return loadSession()?.displayName || null
}

export function isAdmin() {
  return getRole() === 'admin'
}

export function isCustomer() {
  return getRole() === 'customer'
}

export function login(username, password) {
  const trimmedUser = username.trim().toLowerCase()
  const match = Object.values(CREDENTIALS).find(
    (cred) => cred.username === trimmedUser && cred.password === password
  )

  if (match) {
    const session = {
      username: match.username,
      role: match.role,
      userId: match.userId,
      displayName: match.displayName,
      loginTime: new Date().toISOString()
    }
    saveSession(session)
    window.dispatchEvent(new Event(LOGIN_EVENT))
    console.info('frontend_auth_event', { action: 'login', username: match.username, role: match.role })
    return { success: true, role: match.role }
  }

  return { success: false }
}

export function logout() {
  const session = loadSession()
  if (session) {
    console.info('frontend_auth_event', { action: 'logout', username: session.username, role: session.role })
  }
  localStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new Event(LOGIN_EVENT))
}

export function onAuthChange(callback) {
  window.addEventListener(LOGIN_EVENT, callback)
  window.addEventListener('storage', callback)

  return () => {
    window.removeEventListener(LOGIN_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}
