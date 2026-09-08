import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    setUser(await api.post('/auth/login', { email, password }))
  }

  async function signup(displayName, email, password) {
    setUser(await api.post('/auth/signup', { displayName, email, password }))
  }

  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
  }

  function updateUser(patch) {
    setUser((u) => ({ ...u, ...patch }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
