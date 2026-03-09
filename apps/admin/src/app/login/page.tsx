"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("token", data.token)
        toast({
          title: "登入成功",
          description: "歡迎回來！",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "登入失敗",
          description: "帳號或密碼錯誤",
          variant: "destructive",
        })
      }
    } catch (error) {
      // For demo purposes, allow login without backend
      if (process.env.NODE_ENV === "development") {
        localStorage.setItem("token", "demo-token")
        toast({
          title: "開發模式登入",
          description: "已使用測試帳號登入",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "登入失敗",
          description: "發生錯誤，請稍後再試",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">IS</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">管理員登入</CardTitle>
          <CardDescription className="text-center">
            請輸入您的帳號密碼以繼續
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登入中..." : "登入"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              開發模式：輸入任意帳密即可登入
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}