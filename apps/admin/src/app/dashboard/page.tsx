"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  BedDouble,
  CalendarCheck,
  DollarSign,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { DashboardStats } from "@/types"
import { dashboardApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const statsConfig = [
  {
    title: "今日入住",
    icon: CalendarCheck,
    key: "todayCheckIns" as const,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    title: "今日退房",
    icon: BedDouble,
    key: "todayCheckOuts" as const,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    title: "待處理預訂",
    icon: Users,
    key: "pendingBookings" as const,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    title: "本月營收",
    icon: DollarSign,
    key: "totalRevenue" as const,
    color: "text-green-600",
    bgColor: "bg-green-100",
    format: (value: number) => `NT$ ${value.toLocaleString()}`,
  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [bookingTrendData, setBookingTrendData] = useState<any[]>([])
  const [occupancyData, setOccupancyData] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      // Fetch from API only - no mock data fallback
      const statsData = await dashboardApi.getStats()
      setStats(statsData)
      
      // Chart data will be empty until API provides real data
      setRevenueData([])
      setBookingTrendData([])
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      toast({
        title: "載入失敗",
        description: "無法載入儀表板資料，請稍後再試",
        variant: "destructive",
      })
      // Clear stats on error - do not show mock data
      setStats(null)
      setRevenueData([])
      setBookingTrendData([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">儀表板</h1>
        <p className="text-muted-foreground">歡迎回來！以下是今日的營運概況。</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {stat.format
                    ? stat.format(stats?.[stat.key] || 0)
                    : stats?.[stat.key] || 0}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>營收趨勢</CardTitle>
                <CardDescription>近30天營收與預訂數統計</CardDescription>
              </div>
              <Tabs defaultValue="30" className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="7">近7天</TabsTrigger>
                  <TabsTrigger value="30">近30天</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (typeof value === "number") {
                        if (name === "revenue") return [`NT$ ${value.toLocaleString()}`, "營收"]
                        return [value.toString(), "預訂數"]
                      }
                      return [String(value), String(name)]
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="營收"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="bookings"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="預訂數"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Booking Trend */}
        <Card>
          <CardHeader>
            <CardTitle>預訂趨勢</CardTitle>
            <CardDescription>每日預訂狀態變化</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={bookingTrendData.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="new" stackId="a" fill="#3b82f6" name="新預訂" />
                  <Bar dataKey="confirmed" stackId="a" fill="#10b981" name="已確認" />
                  <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="已取消" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card>
          <CardHeader>
            <CardTitle>房間入住率</CardTitle>
            <CardDescription>當前房間狀態分布</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <p className="text-3xl font-bold">{stats?.occupancyRate}%</p>
                  <p className="text-sm text-muted-foreground">入住率</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>總預訂數</CardTitle>
            <CardDescription>本月累計預訂</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalBookings || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>平均房價</CardTitle>
            <CardDescription>本月平均每晚房價</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="text-3xl font-bold">- -</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>取消率</CardTitle>
            <CardDescription>本月預訂取消比例</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="text-3xl font-bold">- -</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
