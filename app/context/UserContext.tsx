'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@/lib/data'

type UserContextValue = {
  user: User | null
  login: (u: User | null) => void
  logout: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('av_user')
      if (stored) setUser(JSON.parse(stored))
    } catch {}
  }, [])

  const login = (u: User | null) => {
    setUser(u)
    if (u) localStorage.setItem('av_user', JSON.stringify(u))
    else localStorage.removeItem('av_user')
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('av_user')
  }

  return <UserContext.Provider value={{ user, login, logout }}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
