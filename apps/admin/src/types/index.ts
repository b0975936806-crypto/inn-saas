export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'staff'
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface RoomType {
  id: string
  name: string
  description: string
  basePrice: number
  maxGuests: number
  amenities: string[]
  images: string[]
  createdAt: string
  updatedAt: string
}

export interface Room {
  id: string
  roomNumber: string
  roomTypeId: string
  roomType?: RoomType
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning'
  floor: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'

export interface Booking {
  id: string
  userId: string
  user?: User
  roomId: string
  room?: Room
  checkIn: string
  checkOut: string
  guests: number
  status: BookingStatus
  totalPrice: number
  specialRequests?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  occupancyRate: number
  todayCheckIns: number
  todayCheckOuts: number
  pendingBookings: number
}

export interface RevenueData {
  date: string
  revenue: number
  bookings: number
}

export interface InnSettings {
  name: string
  address: string
  phone: string
  email: string
  checkInTime: string
  checkOutTime: string
  timezone: string
  currency: string
}

export interface PaymentSettings {
  provider: 'stripe' | 'paypal' | 'ecpay' | 'linepay'
  publicKey?: string
  secretKey?: string
  webhookUrl?: string
  isActive: boolean
}

export interface LineBotSettings {
  channelId: string
  channelSecret: string
  accessToken: string
  webhookUrl?: string
  isActive: boolean
}

// 特殊日期定價
export interface SpecialPrice {
  id: string
  roomTypeId: string
  roomType?: RoomType
  startDate: string
  endDate: string
  price: number
  description?: string
  createdAt: string
  updatedAt: string
}

// 房型價格設定（平日/假日）
export interface RoomTypePricing {
  id: string
  roomTypeId: string
  roomType?: RoomType
  weekdayPrice: number
  weekendPrice: number
  holidayPrice?: number
  updatedAt: string
}

// 月曆訂單概覽
export interface CalendarBookingSummary {
  date: string
  checkIns: number
  checkOuts: number
  occupiedRooms: number
  totalRooms: number
  availableRooms: number
  pendingBookings: number
  confirmedBookings: number
}

// 日訂單詳情
export interface DailyBookingDetail {
  date: string
  bookings: Booking[]
  stats: {
    checkIns: number
    checkOuts: number
    occupiedRooms: number
    availableRooms: number
  }
}

// 營收報表資料
export interface RevenueReport {
  period: 'week' | 'month' | 'year'
  startDate: string
  endDate: string
  totalRevenue: number
  totalBookings: number
  averageDailyRate: number
  occupancyRate: number
  data: RevenueReportDataPoint[]
}

export interface RevenueReportDataPoint {
  date: string
  label: string
  revenue: number
  bookings: number
  occupancyRate: number
}