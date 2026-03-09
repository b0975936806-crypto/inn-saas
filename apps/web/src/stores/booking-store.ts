import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tenant, RoomType, DateRange, Booking } from '@/types';

interface BookingState {
  // 當前租戶
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;

  // 日期選擇
  dateRange: DateRange | null;
  setDateRange: (range: DateRange | null) => void;

  // 客人數量
  guestCount: number;
  setGuestCount: (count: number) => void;

  // 選中的房型
  selectedRoomType: RoomType | null;
  setSelectedRoomType: (roomType: RoomType | null) => void;

  // 當前預訂
  currentBooking: Booking | null;
  setCurrentBooking: (booking: Booking | null) => void;

  // 預訂流程步驟
  bookingStep: number;
  setBookingStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // 重置預訂狀態
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      currentTenant: null,
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),

      dateRange: null,
      setDateRange: (range) => set({ dateRange: range }),

      guestCount: 2,
      setGuestCount: (count) => set({ guestCount: count }),

      selectedRoomType: null,
      setSelectedRoomType: (roomType) => set({ selectedRoomType: roomType }),

      currentBooking: null,
      setCurrentBooking: (booking) => set({ currentBooking: booking }),

      bookingStep: 1,
      setBookingStep: (step) => set({ bookingStep: step }),
      nextStep: () => set((state) => ({ bookingStep: Math.min(state.bookingStep + 1, 4) })),
      prevStep: () => set((state) => ({ bookingStep: Math.max(state.bookingStep - 1, 1) })),

      resetBooking: () => set({
        dateRange: null,
        selectedRoomType: null,
        currentBooking: null,
        bookingStep: 1,
        guestCount: 2,
      }),
    }),
    {
      name: 'inn-saas-booking-storage',
      partialize: (state) => ({
        dateRange: state.dateRange,
        guestCount: state.guestCount,
        selectedRoomType: state.selectedRoomType,
      }),
    }
  )
);

// UI 狀態管理
interface UIState {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
  showMobileMenu: false,
  setShowMobileMenu: (show) => set({ showMobileMenu: show }),
}));
