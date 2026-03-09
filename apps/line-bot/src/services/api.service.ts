import axios from 'axios';
import { config } from '../config';
import { AvailabilityResult, RoomType, Booking } from '../types';

const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 查詢空房
 */
export async function checkAvailability(
  checkIn: string,
  checkOut: string,
  guests: number = 1
): Promise<AvailabilityResult | null> {
  try {
    const response = await apiClient.get('/api/public/availability', {
      params: { checkIn, checkOut, guests },
      headers: {
        'X-Tenant-ID': 'demo', // 預設租戶
      },
    });

    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('查詢空房 API 錯誤:', error);
    return null;
  }
}

/**
 * 取得房型列表
 */
export async function getRoomTypes(): Promise<RoomType[]> {
  try {
    const response = await apiClient.get('/api/room-types', {
      headers: {
        'X-Tenant-ID': 'demo',
      },
    });

    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('取得房型 API 錯誤:', error);
    return [];
  }
}

/**
 * 建立預訂
 */
export async function createBooking(
  roomId: number,
  checkInDate: string,
  checkOutDate: string,
  guestName: string,
  guestPhone: string,
  guestCount: number = 1,
  guestEmail?: string
): Promise<Booking | null> {
  try {
    const response = await apiClient.post('/api/bookings', {
      roomId,
      checkInDate,
      checkOutDate,
      guestName,
      guestPhone,
      guestCount,
      guestEmail,
      source: 'line',
    }, {
      headers: {
        'X-Tenant-ID': 'demo',
      },
    });

    if (response.data.success) {
      return response.data.data.booking;
    }
    return null;
  } catch (error: any) {
    console.error('建立預訂 API 錯誤:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 根據電話查詢預訂
 */
export async function getBookingsByPhone(phone: string): Promise<Booking[]> {
  try {
    // 先取得用戶預訂
    const response = await apiClient.get('/api/bookings', {
      params: { search: phone },
      headers: {
        'X-Tenant-ID': 'demo',
      },
    });

    if (response.data.success) {
      return response.data.data.bookings;
    }
    return [];
  } catch (error) {
    console.error('查詢預訂 API 錯誤:', error);
    return [];
  }
}

/**
 * 根據編號查詢預訂
 */
export async function getBookingByNumber(bookingNumber: string): Promise<Booking | null> {
  try {
    const response = await apiClient.get(`/api/bookings/number/${bookingNumber}`, {
      headers: {
        'X-Tenant-ID': 'demo',
      },
    });

    if (response.data.success) {
      return response.data.data.booking;
    }
    return null;
  } catch (error) {
    console.error('查詢預訂 API 錯誤:', error);
    return null;
  }
}

/**
 * 取消預訂
 */
export async function cancelBooking(bookingId: number, reason?: string): Promise<boolean> {
  try {
    const response = await apiClient.patch(`/api/bookings/${bookingId}/cancel`, {
      reason,
    }, {
      headers: {
        'X-Tenant-ID': 'demo',
      },
    });

    return response.data.success;
  } catch (error) {
    console.error('取消預訂 API 錯誤:', error);
    return false;
  }
}
