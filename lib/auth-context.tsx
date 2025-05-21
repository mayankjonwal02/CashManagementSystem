"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

type User = {
  username: string
  role: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (username: string, password: string, remember: boolean) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if token exists in localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
      verifyToken(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  // Protect routes
  useEffect(() => {
    if (!isLoading) {
      const isAuthPage = pathname === "/login"

      if (!token && !isAuthPage) {
        router.push("/login")
      } else if (token && isAuthPage) {
        router.push("/dashboard")
      }
    }
  }, [token, isLoading, pathname, router])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch("https://asterisk-backend-psi.vercel.app/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Token is invalid
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error("Error verifying token:", error)
      localStorage.removeItem("token")
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string, remember: boolean) => {
    setIsLoading(true)

    try {
      const response = await fetch("https://asterisk-backend-psi.vercel.app/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error("Login failed")
      }

      const data = await response.json()
      const newToken = data.token

      if (remember) {
        localStorage.setItem("token", newToken)
      }

      setToken(newToken)
      await verifyToken(newToken)

      return data
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
