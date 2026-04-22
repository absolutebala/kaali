'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth as authApi, token }                                       from './api-client'
import { useRouter }                                                     from 'next/navigation'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)   // tenant profile
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // ── Load user on mount ──────────────────────────────────
  const loadUser = useCallback(async () => {
    if (!token.exists()) { setLoading(false); return }
    try {
      const data = await authApi.me()
      // data.tenant may include isMember/allowedPages for team members
      setUser(data.tenant)
    } catch {
      token.clear()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  // ── Register ────────────────────────────────────────────
  const register = useCallback(async ({ name, company, email, password }) => {
    const data = await authApi.register({ name, company, email, password })
    token.set(data.token)
    setUser(data.tenant)
    router.push('/dashboard')
    return data
  }, [router])

  // ── Login ───────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const data = await authApi.login({ email, password })
    token.set(data.token)
    // For team members, data.tenant has isMember=true and allowedPages
    setUser(data.tenant)
    router.push('/dashboard')
    return data
  }, [router])

  // ── Logout ──────────────────────────────────────────────
  const logout = useCallback(() => {
    token.clear()
    setUser(null)
    router.push('/auth/login')
  }, [router])

  // ── Refresh user data (call after settings update) ──────
  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me()
      // data.tenant may include isMember/allowedPages for team members
      setUser(data.tenant)
    } catch {}
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
