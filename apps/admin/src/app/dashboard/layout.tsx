"use client"

import { useEffect, useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Sidebar } from "@/components/layout/sidebar"

interface User {
  id: number
  name: string
  email: string
  role: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/admin"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success && data.data) {
        setUser(data.data)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">無法載入用戶資料</p>
          <button 
            onClick={() => window.location.href = "/login"}
            className="text-primary hover:underline"
          >
            重新登入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="p-6">{children}</div>
      </main>
      <Toaster />
    </div>
  )
}
