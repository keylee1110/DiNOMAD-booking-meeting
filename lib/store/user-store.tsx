"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface AppUser {
  name: string
  email: string
  role: "customer" | "partner"
  seed: string   // used to generate DiceBear avatar
}

interface UserContextValue {
  user: AppUser | null
  login: (email: string, role: "customer" | "partner") => void
  logout: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

const STORAGE_KEY = "dinomad_user"

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch {}
  }, [])

  const login = (email: string, role: "customer" | "partner") => {
    const name = email.split("@")[0]
    const newUser: AppUser = {
      name,
      email,
      role,
      // Use email as avatar seed for consistent, unique DiceBear avatar
      seed: email,
    }
    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used inside UserProvider")
  return ctx
}

/** Returns a DiceBear adventurer avatar URL for a given seed string */
export function getDiceBearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc&radius=50`
}
