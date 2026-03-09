import { apiClient } from '@/lib/api-client';
import { Tenant, RoomType, RoomAvailability, RoomFilter, Booking, CreateBookingRequest } from '@/types';

export const tenantService = {
  async getCurrentTenant(): Promise<Tenant> {
    return apiClient.get<Tenant>('/api/tenants/current');
  },

  async getTenantBySubdomain(subdomain: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/api/tenants/subdomain/${subdomain}`);
  },
};

export const roomService = {
  async getRoomTypes(tenantId: string): Promise<RoomType[]> {
    return apiClient.get<RoomType[]>(`/api/room-types?tenantId=${tenantId}`);
  },

  async getRoomTypeById(id: string): Promise<RoomType> {
    return apiClient.get<RoomType>(`/api/room-types/${id}`);
  },

  async checkAvailability(
    tenantId: string,
    filter: RoomFilter
  ): Promise<RoomAvailability[]> {
    const params = new URLSearchParams();
    params.append('tenantId', tenantId);
    if (filter.checkInDate) params.append('checkInDate', filter.checkInDate);
    if (filter.checkOutDate) params.append('checkOutDate', filter.checkOutDate);
    if (filter.guestCount) params.append('guestCount', filter.guestCount.toString());
    if (filter.minPrice) params.append('minPrice', filter.minPrice.toString());
    if (filter.maxPrice) params.append('maxPrice', filter.maxPrice.toString());
    
    return apiClient.get<RoomAvailability[]>(`/api/rooms/availability?${params.toString()}`);
  },
};

export const bookingService = {
  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    return apiClient.post<Booking>('/api/bookings', data);
  },

  async getBookingById(id: string): Promise<Booking> {
    return apiClient.get<Booking>(`/api/bookings/${id}`);
  },

  async getBookingByReference(reference: string): Promise<Booking> {
    return apiClient.get<Booking>(`/api/bookings/reference/${reference}`);
  },
};

export const paymentService = {
  async createPayment(bookingId: string, method: 'ecpay' | 'linepay'): Promise<{ paymentUrl: string; transactionId: string }> {
    return apiClient.post<{ paymentUrl: string; transactionId: string }>('/api/payments', {
      bookingId,
      method,
      returnUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/booking/confirm`,
    });
  },

  async checkPaymentStatus(transactionId: string): Promise<{ status: string; bookingId: string }> {
    return apiClient.get<{ status: string; bookingId: string }>(`/api/payments/status/${transactionId}`);
  },
};
