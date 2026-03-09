"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Plus, Mail, Shield, UserCog, Users, Edit, Trash2, AlertTriangle } from "lucide-react"
import type { User } from "@/types"
import { userApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const roleConfig = {
  admin: { label: "管理員", variant: "destructive" as const, icon: Shield, description: "完整系統權限" },
  manager: { label: "經理", variant: "default" as const, icon: UserCog, description: "管理預訂與房間" },
  staff: { label: "員工", variant: "secondary" as const, icon: Users, description: "基本操作權限" },
}

interface UserFormData {
  name: string
  email: string
  role: User["role"]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    role: "staff",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const data = await userApi.getAll()
      setUsers(data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "載入失敗",
        description: "無法載入用戶資料，請稍後再試",
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditRole = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    })
    setIsRoleDialogOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return
    
    setIsSubmitting(true)
    try {
      await userApi.updateRole(selectedUser.id, formData.role)
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: formData.role } : u))
      setIsRoleDialogOpen(false)
      toast({
        title: "權限更新成功",
        description: `${selectedUser.name} 的角色已更新為 ${roleConfig[formData.role].label}`,
      })
    } catch (error) {
      console.error("Failed to update role:", error)
      toast({
        title: "更新失敗",
        description: "無法更新用戶權限，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedUser) return
    
    setIsSubmitting(true)
    try {
      // await userApi.delete(selectedUser.id)
      setUsers(users.filter(u => u.id !== selectedUser.id))
      setIsDeleteOpen(false)
      toast({
        title: "刪除成功",
        description: `用戶 ${selectedUser.name} 已刪除`,
      })
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast({
        title: "刪除失敗",
        description: "無法刪除此用戶，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleIcon = (role: User["role"]) => {
    const Icon = roleConfig[role].icon
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">用戶管理</h1>
          <p className="text-muted-foreground">管理系統用戶與權限</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增用戶
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "總用戶", count: users.length, icon: Users, color: "text-primary" },
          { label: "管理員", count: users.filter((u) => u.role === "admin").length, icon: Shield, color: "text-destructive" },
          { label: "經理", count: users.filter((u) => u.role === "manager").length, icon: UserCog, color: "text-blue-600" },
          { label: "員工", count: users.filter((u) => u.role === "staff").length, icon: Users, color: "text-green-600" },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <p className="text-3xl font-bold mt-1">{isLoading ? "-" : stat.count}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>用戶列表</CardTitle>
              <CardDescription>共 {users.length} 位用戶</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋用戶（姓名、Email）..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用戶</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>加入日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <Badge variant={roleConfig[user.role].variant}>
                          {roleConfig[user.role].label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("zh-TW")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditRole(user)}
                        title="編輯權限"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user)}
                        title="刪除用戶"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>編輯用戶權限</DialogTitle>
            <DialogDescription>
              修改 {selectedUser?.name} 的角色權限
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label>選擇角色</Label>
                <div className="grid gap-3">
                  {(Object.keys(roleConfig) as User["role"][]).map((role) => {
                    const config = roleConfig[role]
                    const Icon = config.icon
                    return (
                      <div
                        key={role}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.role === role
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setFormData({ ...formData, role })}
                      >
                        <div className={`p-2 rounded-lg ${
                          role === "admin" ? "bg-destructive/10" :
                          role === "manager" ? "bg-primary/10" : "bg-secondary"
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            role === "admin" ? "text-destructive" :
                            role === "manager" ? "text-primary" : "text-secondary-foreground"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{config.label}</p>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                        {formData.role === role && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleUpdateRole} disabled={isSubmitting}>
              {isSubmitting ? "更新中..." : "儲存變更"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              確認刪除用戶
            </AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除用戶「{selectedUser?.name}」嗎？
              此操作無法撤銷，該用戶將無法再登入系統。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? "刪除中..." : "刪除用戶"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
