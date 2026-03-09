"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
import { Search, Calendar, Eye, CheckCircle, XCircle, DoorOpen, LogOut, Trash2, CalendarDays } from "lucide-react"
import type { Booking, BookingStatus } from "@/types"
import { bookingApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const statusConfig: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  pending: { label: "待確認", variant: "outline", color: "text-yellow-600" },
  confirmed: { label: "已確認", variant: "default", color: "text-blue-600" },
  checked_in: { label: "已入住", variant: "secondary", color: "text-green-600" },
  checked_out: { label: "已退房", variant: "default", color: "text-gray-600" },
  cancelled: { label: "已取消", variant: "destructive", color: "text-red-600" },
}

const statusFlow: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled"],
  checked_in: ["checked_out"],
  checked_out: [],
  cancelled: [],
}

const nextStatusLabel: Record<BookingStatus, string | null> = {
  pending: "確認預訂",
  confirmed: "辦理入住",
  checked_in: "辦理退房",
  checked_out: null,
  cancelled: null,
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      const data = await bookingApi.getAll()
      setBookings(data)
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
      toast({
        title: "載入失敗",
        description: "無法載入預訂資料，請稍後再試",
        variant: "destructive",
      })
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.room?.roomNumber.includes(searchQuery) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    setIsProcessing(true)
    try {
      await bookingApi.updateStatus(bookingId, newStatus)
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))
      toast({
        title: "狀態更新成功",
        description: `預訂狀態已更新為「${statusConfig[newStatus].label}」`,
      })
      
      // Update selected booking if detail dialog is open
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus })
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      toast({
        title: "更新失敗",
        description: "無法更新預訂狀態，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAdvanceStatus = async () => {
    if (!selectedBooking) return
    
    const statusOrder: BookingStatus[] = ["pending", "confirmed", "checked_in", "checked_out"]
    const currentIndex = statusOrder.indexOf(selectedBooking.status)
    
    if (currentIndex < statusOrder.length - 1 && selectedBooking.status !== "cancelled") {
      const nextStatus = statusOrder[currentIndex + 1]
      await handleStatusChange(selectedBooking.id, nextStatus)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    
    setIsProcessing(true)
    try {
      await bookingApi.updateStatus(selectedBooking.id, "cancelled")
      setBookings(bookings.map(b => b.id === selectedBooking.id ? { ...b, status: "cancelled" } : b))
      setSelectedBooking({ ...selectedBooking, status: "cancelled" })
      setIsCancelOpen(false)
      toast({
        title: "預訂已取消",
        description: `預訂 #${selectedBooking.id} 已成功取消`,
      })
    } catch (error) {
      console.error("Failed to cancel booking:", error)
      toast({
        title: "取消失敗",
        description: "無法取消此預訂，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case "pending": return <CheckCircle className="h-4 w-4" />
      case "confirmed": return <DoorOpen className="h-4 w-4" />
      case "checked_in": return <LogOut className="h-4 w-4" />
      default: return null
    }
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">預訂管理</h1>
          <p className="text-muted-foreground">管理所有預訂訂單</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/bookings/calendar">
            <Button variant="outline">
              <CalendarDays className="mr-2 h-4 w-4" />
              月曆檢視
            </Button>
          </Link>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            新增預訂
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "待確認", value: bookings.filter((b) => b.status === "pending").length, color: "text-yellow-600" },
          { label: "已確認", value: bookings.filter((b) => b.status === "confirmed").length, color: "text-blue-600" },
          { label: "已入住", value: bookings.filter((b) => b.status === "checked_in").length, color: "text-green-600" },
          { label: "已退房", value: bookings.filter((b) => b.status === "checked_out").length, color: "text-gray-600" },
          { label: "總預訂", value: bookings.length, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{isLoading ? "-" : stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋預訂（客人姓名、房號、訂單編號）..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | "all")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="篩選狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending">待確認</SelectItem>
                <SelectItem value="confirmed">已確認</SelectItem>
                <SelectItem value="checked_in">已入住</SelectItem>
                <SelectItem value="checked_out">已退房</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
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
                  <TableHead>預訂編號</TableHead>
                  <TableHead>客人</TableHead>
                  <TableHead>房間</TableHead>
                  <TableHead>入住日期</TableHead>
                  <TableHead>退房日期</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">總金額</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">#{booking.id}</TableCell>
                    <TableCell className="font-medium">{booking.user?.name}</TableCell>
                    <TableCell>{booking.room?.roomNumber}</TableCell>
                    <TableCell>{booking.checkIn}</TableCell>
                    <TableCell>{booking.checkOut}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[booking.status].variant}>
                        {statusConfig[booking.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      NT$ {booking.totalPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>預訂詳情 #{selectedBooking?.id}</DialogTitle>
              {selectedBooking && (
                <Badge variant={statusConfig[selectedBooking.status].variant}>
                  {statusConfig[selectedBooking.status].label}
                </Badge>
              )}
            </div>
            <DialogDescription>
              查看和管理此預訂的詳細資訊
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Guest Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">客人姓名</Label>
                    <p className="text-lg font-medium">{selectedBooking.user?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">聯絡 Email</Label>
                    <p>{selectedBooking.user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">入住人數</Label>
                    <p>{selectedBooking.guests} 人</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">房間號碼</Label>
                    <p className="text-lg font-medium">{selectedBooking.room?.roomNumber}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-muted-foreground">入住日期</Label>
                      <p>{selectedBooking.checkIn}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">退房日期</Label>
                      <p>{selectedBooking.checkOut}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">住宿晚數</Label>
                    <p>{calculateNights(selectedBooking.checkIn, selectedBooking.checkOut)} 晚</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">總金額</Label>
                <p className="text-2xl font-bold text-primary">
                  NT$ {selectedBooking.totalPrice.toLocaleString()}
                </p>
              </div>

              {selectedBooking.specialRequests && (
                <div className="bg-muted p-3 rounded-lg">
                  <Label className="text-muted-foreground">特殊需求</Label>
                  <p>{selectedBooking.specialRequests}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p>預訂時間: {new Date(selectedBooking.createdAt).toLocaleString("zh-TW")}</p>
                <p>最後更新: {new Date(selectedBooking.updatedAt).toLocaleString("zh-TW")}</p>
              </div>

              {/* Action Buttons */}
              <DialogFooter className="gap-2">
                {selectedBooking.status !== "cancelled" && selectedBooking.status !== "checked_out" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setIsCancelOpen(true)}
                      disabled={isProcessing}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      取消預訂
                    </Button>
                    
                    {nextStatusLabel[selectedBooking.status] && (
                      <Button
                        onClick={handleAdvanceStatus}
                        disabled={isProcessing}
                      >
                        {getStatusIcon(selectedBooking.status)}
                        <span className="ml-2">{nextStatusLabel[selectedBooking.status]}</span>
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認取消預訂</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要取消預訂 #{selectedBooking?.id} 嗎？
              此操作無法撤銷，且已付款項可能需要進行退款處理。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? "處理中..." : "確認取消"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
