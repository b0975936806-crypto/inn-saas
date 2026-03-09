"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  BedDouble, 
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  Percent
} from "lucide-react"
import type { RevenueReport } from "@/types"
import { reportApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("week")
  const [weeklyReport, setWeeklyReport] = useState<RevenueReport | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<RevenueReport | null>(null)
  const [yearlyReport, setYearlyReport] = useState<RevenueReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
  }, [selectedYear, selectedMonth])

  const fetchReports = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all reports in parallel
      const [weekly, monthly, yearly] = await Promise.all([
        reportApi.getWeeklyReport(),
        reportApi.getMonthlyReport(selectedYear, selectedMonth),
        reportApi.getYearlyReport(selectedYear),
      ])
      
      setWeeklyReport(weekly)
      setMonthlyReport(monthly)
      setYearlyReport(yearly)
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      toast({
        title: "載入失敗",
        description: "無法載入報表資料，請檢查網路連線",
        variant: "destructive",
      })
      setWeeklyReport(null)
      setMonthlyReport(null)
      setYearlyReport(null)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `NT$ ${amount.toLocaleString()}`
  
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月`
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  
  // Generate year options (current year and past 2 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i)

  // Prepare chart data for weekly report
  const weeklyChartData = weeklyReport?.data.map(d => ({
    ...d,
    displayDate: formatDate(d.date),
  })) || []

  // Prepare chart data for monthly report
  const monthlyChartData = monthlyReport?.data.map(d => ({
    ...d,
    displayDate: formatDate(d.date),
  })) || []

  // Prepare chart data for yearly report
  const yearlyChartData = yearlyReport?.data.map(d => ({
    ...d,
    displayLabel: d.label || formatMonth(d.date),
  })) || []

  // Calculate occupancy stats for pie chart
  const getOccupancyStats = () => {
    const report = activeTab === "week" ? weeklyReport : activeTab === "month" ? monthlyReport : yearlyReport
    if (!report) return []
    
    const avgOccupancy = report.occupancyRate
    return [
      { name: "已入住", value: avgOccupancy, color: "#10b981" },
      { name: "空房", value: 1 - avgOccupancy, color: "#e5e7eb" },
    ]
  }

  const occupancyStats = getOccupancyStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">營收報表</h1>
          <p className="text-muted-foreground">查看營收趨勢、入住率與預訂統計</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            重新整理
          </Button>
        </div>
      </div>

      {/* Period Selectors */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedYear.toString()}
          onValueChange={(v) => setSelectedYear(parseInt(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="選擇年份" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedMonth.toString()}
          onValueChange={(v) => setSelectedMonth(parseInt(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="選擇月份" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((month) => (
              <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="week">週報表</TabsTrigger>
          <TabsTrigger value="month">月報表</TabsTrigger>
          <TabsTrigger value="year">年報表</TabsTrigger>
        </TabsList>

        {/* Weekly Report */}
        <TabsContent value="week" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本週營收</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(weeklyReport?.totalRevenue || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本週訂單</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {weeklyReport?.totalBookings || 0} 筆
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均房價</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(weeklyReport?.averageDailyRate || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">入住率</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatPercent(weeklyReport?.occupancyRate || 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Weekly Chart */}
          <Card>
            <CardHeader>
              <CardTitle>近7天營收趨勢</CardTitle>
              <CardDescription>每日營收與預訂數統計</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : weeklyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayDate" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "revenue") return [formatCurrency(Number(value)), "營收"]
                        return [String(value), "預訂數"]
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
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  暫無資料
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle>每日明細</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : weeklyChartData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead className="text-right">營收</TableHead>
                      <TableHead className="text-right">預訂數</TableHead>
                      <TableHead className="text-right">入住率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...weeklyChartData].reverse().map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{row.displayDate}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.revenue)}
                        </TableCell>
                        <TableCell className="text-right">{row.bookings}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={row.occupancyRate > 0.7 ? "default" : "secondary"}>
                            {formatPercent(row.occupancyRate)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">暫無資料</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Report */}
        <TabsContent value="month" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本月營收</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(monthlyReport?.totalRevenue || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本月訂單</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {monthlyReport?.totalBookings || 0} 筆
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均房價</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(monthlyReport?.averageDailyRate || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">入住率</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatPercent(monthlyReport?.occupancyRate || 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Chart */}
          <Card>
            <CardHeader>
              <CardTitle>當月每日營收</CardTitle>
              <CardDescription>每日營收與預訂數統計</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayDate" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "revenue") return [formatCurrency(Number(value)), "營收"]
                        return [String(value), "預訂數"]
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      fill="#3b82f6"
                      name="營收"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="bookings"
                      fill="#10b981"
                      name="預訂數"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">暫無資料</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Yearly Report */}
        <TabsContent value="year" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">年度營收</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(yearlyReport?.totalRevenue || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">年度訂單</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {yearlyReport?.totalBookings || 0} 筆
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均房價</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(yearlyReport?.averageDailyRate || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均入住率</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatPercent(yearlyReport?.occupancyRate || 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Yearly Chart */}
          <Card>
            <CardHeader>
              <CardTitle>每月營收總覽</CardTitle>
              <CardDescription>各月營收與預訂數統計</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : yearlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={yearlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayLabel" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "revenue") return [formatCurrency(Number(value)), "營收"]
                        return [String(value), "預訂數"]
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6" }}
                      name="營收"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bookings"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981" }}
                      name="預訂數"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">暫無資料</div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle>每月明細</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : yearlyChartData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>月份</TableHead>
                      <TableHead className="text-right">營收</TableHead>
                      <TableHead className="text-right">預訂數</TableHead>
                      <TableHead className="text-right">平均房價</TableHead>
                      <TableHead className="text-right">入住率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearlyChartData.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="font-medium">{row.displayLabel}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                        <TableCell className="text-right">{row.bookings}</TableCell>
                        <TableCell className="text-right">
                          {row.bookings > 0 ? formatCurrency(row.revenue / row.bookings) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={row.occupancyRate > 0.7 ? "default" : "secondary"}>
                            {formatPercent(row.occupancyRate)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">暫無資料</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Occupancy Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>入住率視覺化</CardTitle>
          <CardDescription>當前選擇期間的平均入住率</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="flex items-center justify-center gap-8">
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={occupancyStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {occupancyStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPercent(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {formatPercent(
                        activeTab === "week" 
                          ? weeklyReport?.occupancyRate || 0 
                          : activeTab === "month" 
                            ? monthlyReport?.occupancyRate || 0 
                            : yearlyReport?.occupancyRate || 0
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">入住率</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {occupancyStats.map((stat) => (
                  <div key={stat.name} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="text-sm">{stat.name}</span>
                    <span className="text-sm font-medium">{formatPercent(stat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}