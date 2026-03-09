"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Calendar, Users, DoorOpen, LogOut, AlertCircle } from "lucide-react"
import type { CalendarBookingSummary, DailyBookingDetail, BookingStatus } from "@/types"
import { calendarApi, bookingApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const statusConfig: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待確認", variant: "outline" },
  confirmed: { label: "已確認", variant: "default" },
  checked_in: { label: "已入住", variant: "secondary" },
  checked_out: { label: "已退房", variant: "default" },
  cancelled: { label: "已取消", variant: "destructive" },
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarBookingSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dailyDetails, setDailyDetails] = useState<DailyBookingDetail | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const { toast } = useToast()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  useEffect(() => {
    fetchCalendarData()
  }, [year, month])

  const fetchCalendarData = async () => {
    try {
      setIsLoading(true)
      const data = await calendarApi.getMonthlySummary(year, month)
      setCalendarData(data)
    } catch (error) {
      console.error("Failed to fetch calendar data:", error)
      toast({
        title: "載入失敗",
        description: "無法載入月曆資料，請檢查網路連線",
        variant: "destructive",
      })
      setCalendarData([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateClick = async (dateStr: string) => {
    setSelectedDate(dateStr)
    setIsDetailOpen(true)
    setIsLoadingDetails(true)
    
    try {
      const details = await calendarApi.getDailyDetails(dateStr)
      setDailyDetails(details)
    } catch (error) {
      console.error("Failed to fetch daily details:", error)
      toast({
        title: "載入失敗",
        description: "無法載入當日訂單詳情",
        variant: "destructive",
      })
      setDailyDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Generate calendar grid
  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(year, month - 1, 1)
    const lastDayOfMonth = new Date(year, month, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startDayOfWeek = firstDayOfMonth.getDay()

    const days: (Date | null)[] = []
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month - 1, i))
    }
    
    return days
  }

  const getDayData = (date: Date): CalendarBookingSummary | undefined => {
    const dateStr = date.toISOString().split("T")[0]
    return calendarData.find(d => d.date === dateStr)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const calendarDays = generateCalendarDays()
  const todayStr = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">預訂月曆</h1>
          <p className="text-muted-foreground">查看每日入住、退房與空房狀況</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/bookings">
            <Button variant="outline">返回列表</Button>
          </Link>
        </div>
      </div>

      {/* Calendar Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {year}年 {month}月
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                今天
              </Button>
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 bg-muted">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-sm font-medium text-muted-foreground border-b"
                  >
                    週{day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[100px] bg-muted/30 border-b border-r"
                      />
                    )
                  }

                  const dayData = getDayData(date)
                  const dateStr = date.toISOString().split("T")[0]
                  const isCurrentDay = isToday(date)

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleDateClick(dateStr)}
                      className={`
                        min-h-[100px] p-2 border-b border-r cursor-pointer
                        hover:bg-muted/50 transition-colors
                        ${isCurrentDay ? "bg-blue-50" : ""}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`
                            text-sm font-medium
                            ${isCurrentDay ? "text-blue-600" : ""}
                          `}
                        >
                          {date.getDate()}
                        </span>
                        {isCurrentDay && (
                          <span className="text-xs text-blue-600 font-medium">今天</span>
                        )}
                      </div>

                      {dayData && (
                        <div className="space-y-1">
                          {dayData.checkIns > 0 && (
                            <div className="flex items-center text-xs text-green-600">
                              <DoorOpen className="h-3 w-3 mr-1" />
                              <span>入住 {dayData.checkIns}</span>
                            </div>
                          )}
                          {dayData.checkOuts > 0 && (
                            <div className="flex items-center text-xs text-orange-600">
                              <LogOut className="h-3 w-3 mr-1" />
                              <span>退房 {dayData.checkOuts}</span>
                            </div>
                          )}
                          {dayData.pendingBookings > 0 && (
                            <div className="flex items-center text-xs text-yellow-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              <span>待確認 {dayData.pendingBookings}</span>
                            </div>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <span>空房 {dayData.availableRooms}/{dayData.totalRooms}</span>
                          </div>
                        </div>
                      )}

                      {!dayData && (
                        <div className="text-xs text-muted-foreground mt-2">
                          載入中...
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>入住</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>退房</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>待確認</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          <span>今天</span>
        </div>
      </div>

      {/* Daily Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedDate} 訂單詳情
            </DialogTitle>
            <DialogDescription>
              查看當天所有預訂與房間狀況
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : dailyDetails ? (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">今日入住</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{dailyDetails.stats.checkIns}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-muted-foreground">今日退房</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{dailyDetails.stats.checkOuts}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">已住房間</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{dailyDetails.stats.occupiedRooms}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">可用房間</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{dailyDetails.stats.availableRooms}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bookings Table */}
              {dailyDetails.bookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>訂單編號</TableHead>
                      <TableHead>客人</TableHead>
                      <TableHead>房間</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyDetails.bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">#{booking.id}</TableCell>
                        <TableCell className="font-medium">{booking.user?.name}</TableCell>
                        <TableCell>{booking.room?.roomNumber}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[booking.status].variant}>
                            {statusConfig[booking.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          NT$ {booking.totalPrice.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>當天沒有預訂</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>無法載入當日資料</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}