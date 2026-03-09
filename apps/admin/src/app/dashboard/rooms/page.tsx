"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Search, BedDouble, Edit, Trash2, AlertTriangle } from "lucide-react"
import type { Room } from "@/types"
import { roomApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const statusConfig = {
  available: { label: "可入住", variant: "default" as const },
  occupied: { label: "已入住", variant: "secondary" as const },
  maintenance: { label: "維修中", variant: "destructive" as const },
  cleaning: { label: "清潔中", variant: "outline" as const },
}

const roomTypes = [
  { id: "1", name: "雙人房" },
  { id: "2", name: "四人房" },
  { id: "3", name: "豪華套房" },
]

const floors = [1, 2, 3, 4, 5]

interface RoomFormData {
  roomNumber: string
  roomTypeId: string
  status: Room["status"]
  floor: number
  notes: string
}

const defaultFormData: RoomFormData = {
  roomNumber: "",
  roomTypeId: "",
  status: "available",
  floor: 1,
  notes: "",
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState<RoomFormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setIsLoading(true)
      const data = await roomApi.getAll()
      setRooms(data)
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
      toast({
        title: "載入失敗",
        description: "無法載入房間資料，請稍後再試",
        variant: "destructive",
      })
      setRooms([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRooms = rooms.filter(
    (room) =>
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = () => {
    setSelectedRoom(null)
    setFormData(defaultFormData)
    setIsFormOpen(true)
  }

  const handleEdit = (room: Room) => {
    setSelectedRoom(room)
    setFormData({
      roomNumber: room.roomNumber,
      roomTypeId: room.roomTypeId,
      status: room.status,
      floor: room.floor,
      notes: room.notes || "",
    })
    setIsFormOpen(true)
  }

  const handleDelete = (room: Room) => {
    setSelectedRoom(room)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (selectedRoom) {
        // Update
        await roomApi.update(selectedRoom.id, formData)
        toast({
          title: "更新成功",
          description: `房間 ${formData.roomNumber} 已更新`,
        })
      } else {
        // Create
        await roomApi.create(formData)
        toast({
          title: "新增成功",
          description: `房間 ${formData.roomNumber} 已建立`,
        })
      }
      
      setIsFormOpen(false)
      fetchRooms()
    } catch (error) {
      console.error("Failed to save room:", error)
      toast({
        title: "儲存失敗",
        description: "請檢查輸入資料是否正確",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedRoom) return
    
    setIsSubmitting(true)
    try {
      await roomApi.delete(selectedRoom.id)
      toast({
        title: "刪除成功",
        description: `房間 ${selectedRoom.roomNumber} 已刪除`,
      })
      setIsDeleteOpen(false)
      fetchRooms()
    } catch (error) {
      console.error("Failed to delete room:", error)
      toast({
        title: "刪除失敗",
        description: "無法刪除此房間，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoomTypeName = (id: string) => {
    return roomTypes.find((t) => t.id === id)?.name || id
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">房間管理</h1>
          <p className="text-muted-foreground">管理房型與房間狀態</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增房間
        </Button>
      </div>

      {/* Room Type Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { name: "雙人房", count: rooms.filter(r => r.roomTypeId === "1").length, price: 2800 },
          { name: "四人房", count: rooms.filter(r => r.roomTypeId === "2").length, price: 4200 },
          { name: "豪華套房", count: rooms.filter(r => r.roomTypeId === "3").length, price: 6800 },
        ].map((type) => (
          <Card key={type.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{type.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{type.count}</p>
                  <p className="text-sm text-muted-foreground">間</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  NT$ {type.price.toLocaleString()}/晚
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rooms Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>房間列表</CardTitle>
              <CardDescription>共 {rooms.length} 間房間</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋房間..."
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
                  <TableHead>房號</TableHead>
                  <TableHead>房型</TableHead>
                  <TableHead>樓層</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>備註</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.roomNumber}</TableCell>
                    <TableCell>{getRoomTypeName(room.roomTypeId)}</TableCell>
                    <TableCell>{room.floor}F</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[room.status].variant}>
                        {statusConfig[room.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {room.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(room)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(room)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRoom ? "編輯房間" : "新增房間"}
            </DialogTitle>
            <DialogDescription>
              {selectedRoom
                ? "修改房間資訊"
                : "建立新的房間"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">房號 *</Label>
                  <Input
                    id="roomNumber"
                    value={formData.roomNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, roomNumber: e.target.value })
                    }
                    placeholder="例如：101"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="floor">樓層 *</Label>
                  <Select
                    value={formData.floor.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, floor: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇樓層" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((floor) => (
                        <SelectItem key={floor} value={floor.toString()}>
                          {floor} 樓
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomType">房型 *</Label>
                <Select
                  value={formData.roomTypeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, roomTypeId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇房型" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">狀態 *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Room["status"]) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇狀態" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">可入住</SelectItem>
                    <SelectItem value="occupied">已入住</SelectItem>
                    <SelectItem value="maintenance">維修中</SelectItem>
                    <SelectItem value="cleaning">清潔中</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">備註</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="選填"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "儲存中..." : selectedRoom ? "儲存變更" : "建立房間"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              確認刪除
            </AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除房間「{selectedRoom?.roomNumber}」嗎？
              此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? "刪除中..." : "刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
