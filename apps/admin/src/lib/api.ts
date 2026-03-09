import type { Booking, Room, User, DashboardStats, RevenueData, InnSettings, PaymentSettings, RoomTypePricing, SpecialPrice, CalendarBookingSummary, DailyBookingDetail, RevenueReport } from "@/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/admin"

// Helper to get auth token
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin_token")
  }
  return null
}

// Helper to make authenticated requests
async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: "include",
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("admin_token")
      window.location.href = "/login"
    }
    const error = await response.json().catch(() => ({ message: "Unknown error" }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// Dashboard APIs
export const dashboardApi = {
  getStats: () => fetchWithAuth<DashboardStats>("/dashboard/stats"),
  getRevenue: (days: number = 30) => 
    fetchWithAuth<RevenueData[]>(`/dashboard/revenue?days=${days}`),
  getOccupancy: (days: number = 30) =>
    fetchWithAuth<{ date: string; rate: number }[]>(`/dashboard/occupancy?days=${days}`),
  getBookingTrend: (days: number = 30) =>
    fetchWithAuth<{ date: string; count: number }[]>(`/dashboard/booking-trend?days=${days}`),
}

// Room APIs
export const roomApi = {
  getAll: () => fetchWithAuth<Room[]>("/rooms"),
  getById: (id: string) => fetchWithAuth<Room>(`/rooms/${id}`),
  create: (data: Omit<Room, "id" | "createdAt" | "updatedAt">) =>
    fetchWithAuth<Room>("/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Room>) =>
    fetchWithAuth<Room>(`/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth<void>(`/rooms/${id}`, {
      method: "DELETE",
    }),
}

// Booking APIs
export const bookingApi = {
  getAll: () => fetchWithAuth<Booking[]>("/bookings"),
  getById: (id: string) => fetchWithAuth<Booking>(`/bookings/${id}`),
  create: (data: Omit<Booking, "id" | "createdAt" | "updatedAt">) =>
    fetchWithAuth<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Booking>) =>
    fetchWithAuth<Booking>(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, status: Booking["status"]) =>
    fetchWithAuth<Booking>(`/bookings/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    fetchWithAuth<void>(`/bookings/${id}`, {
      method: "DELETE",
    }),
}

// User APIs
export const userApi = {
  getAll: () => fetchWithAuth<User[]>("/users"),
  getById: (id: string) => fetchWithAuth<User>(`/users/${id}`),
  update: (id: string, data: Partial<User>) =>
    fetchWithAuth<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateRole: (id: string, role: User["role"]) =>
    fetchWithAuth<User>(`/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),
}

// Settings APIs
export const settingsApi = {
  getInn: () => fetchWithAuth<InnSettings>("/settings/inn"),
  updateInn: (data: InnSettings) =>
    fetchWithAuth<InnSettings>("/settings/inn", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getPayment: () => fetchWithAuth<PaymentSettings>("/settings/payment"),
  updatePayment: (data: PaymentSettings) =>
    fetchWithAuth<PaymentSettings>("/settings/payment", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

// Auth APIs
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Login failed" }))
      throw new Error(error.message)
    }
    
    const data = await response.json()
    if (data.token) {
      localStorage.setItem("admin_token", data.token)
    }
    return data
  },
  logout: () => {
    localStorage.removeItem("admin_token")
    window.location.href = "/login"
  },
  getToken: () => getAuthToken(),
  isAuthenticated: () => !!getAuthToken(),
}

// Pricing APIs
export const pricingApi = {
  getRoomTypePricing: (roomTypeId: string) => 
    fetchWithAuth<RoomTypePricing>(`/pricing/room-types/${roomTypeId}`),
  updateRoomTypePricing: (roomTypeId: string, data: Partial<RoomTypePricing>) =>
    fetchWithAuth<RoomTypePricing>(`/pricing/room-types/${roomTypeId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getSpecialPrices: (roomTypeId?: string) => 
    fetchWithAuth<SpecialPrice[]>(`/pricing/special-prices${roomTypeId ? `?roomTypeId=${roomTypeId}` : ''}`),
  createSpecialPrice: (data: Omit<SpecialPrice, "id" | "createdAt" | "updatedAt">) =>
    fetchWithAuth<SpecialPrice>("/pricing/special-prices", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSpecialPrice: (id: string, data: Partial<SpecialPrice>) =>
    fetchWithAuth<SpecialPrice>(`/pricing/special-prices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteSpecialPrice: (id: string) =>
    fetchWithAuth<void>(`/pricing/special-prices/${id}`, {
      method: "DELETE",
    }),
}

// Calendar APIs
export const calendarApi = {
  getMonthlySummary: (year: number, month: number) =>
    fetchWithAuth<CalendarBookingSummary[]>(`/calendar/summary?year=${year}&month=${month}`),
  getDailyDetails: (date: string) =>
    fetchWithAuth<DailyBookingDetail>(`/calendar/daily?date=${date}`),
}

// Report APIs
export const reportApi = {
  getWeeklyReport: () =>
    fetchWithAuth<RevenueReport>("/reports/revenue?period=week"),
  getMonthlyReport: (year?: number, month?: number) =>
    fetchWithAuth<RevenueReport>(`/reports/revenue?period=month${year ? `&year=${year}` : ''}${month ? `&month=${month}` : ''}`),
  getYearlyReport: (year?: number) =>
    fetchWithAuth<RevenueReport>(`/reports/revenue?period=year${year ? `&year=${year}` : ''}`),
  getOccupancyStats: (startDate: string, endDate: string) =>
    fetchWithAuth<{ date: string; rate: number; totalRooms: number; occupiedRooms: number }[]>(`/reports/occupancy?startDate=${startDate}&endDate=${endDate}`),
}
