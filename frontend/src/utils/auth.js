const AUTH_STORAGE_KEY = 'isLoggedIn'
const LOGIN_EVENT = 'auth-state-changed'

export const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
}

export function isLoggedIn() {
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
}

export function login(username, password) {
  const isValid = username === LOGIN_CREDENTIALS.username && password === LOGIN_CREDENTIALS.password
  if (isValid) {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true')
    window.dispatchEvent(new Event(LOGIN_EVENT))
  }
  return isValid
}

export function logout() {
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
