import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('meridian_user')
    return stored ? JSON.parse(stored) : null
  })
  const [initializing, setInitializing] = useState(true)

  // On load, verify the stored token is still valid rather than trusting
  // stale sessionStorage state.
  useEffect(() => {
    const token = sessionStorage.getItem('meridian_token')
    if (!token) {
      setInitializing(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user)
        sessionStorage.setItem('meridian_user', JSON.stringify(res.data.user))
      })
      .catch(() => {
        sessionStorage.removeItem('meridian_token')
        sessionStorage.removeItem('meridian_user')
        setUser(null)
      })
      .finally(() => setInitializing(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: loggedInUser } = res.data
    sessionStorage.setItem('meridian_token', token)
    sessionStorage.setItem('meridian_user', JSON.stringify(loggedInUser))
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload)
    const { token, user: newUser } = res.data
    sessionStorage.setItem('meridian_token', token)
    sessionStorage.setItem('meridian_user', JSON.stringify(newUser))
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('meridian_token')
    sessionStorage.removeItem('meridian_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
