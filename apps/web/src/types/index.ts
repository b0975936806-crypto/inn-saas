// 民宿/租戶類型
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 房間類型
export interface RoomType {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  basePrice: number;
  maxGuests: number;
  bedCount: number;
  bathroomCount: number;
  squareMeters?: number;
  amenities: string[];
  images: RoomImage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomImage {
  id: string;
  url: string;
  order: number;
  isCover: boolean;
}

// 房間實例
export interface Room {
  id: string;
  roomTypeId: string;
  roomNumber: string;
  floor?: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  notes?: string;
  roomType?: RoomType;
}

// 空房查詢結果
export interface RoomAvailability {
  roomTypeId: string;
  roomType: RoomType;
  availableRooms: Room[];
  availableCount: number;
  pricePerNight: number;
  totalNights: number;
  totalPrice: number;
}

// 預訂相關
export interface Booking {
  id: string;
  tenantId: string;
  roomTypeId: string;
  roomId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalNights: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'ecpay' | 'linepay' | 'cash';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  roomType?: RoomType;
}

// 建立預訂請求
export interface CreateBookingRequest {
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: number;
  specialRequests?: string;
}

// 金流相關
export interface PaymentRequest {
  bookingId: string;
  amount: number;
  description: string;
  returnUrl: string;
}

export interface PaymentResponse {
  paymentUrl?: string;
  formData?: Record<string, string>;
  transactionId?: string;
}

// API 響應格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// 篩選條件
export interface RoomFilter {
  checkInDate?: string;
  checkOutDate?: string;
  guestCount?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
}

// 日期範圍
export interface DateRange {
  from: Date;
  to?: Date;
}
