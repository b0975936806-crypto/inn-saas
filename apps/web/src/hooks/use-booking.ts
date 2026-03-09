import { useState, useCallback } from 'react';
import { CreateBookingRequest, Booking } from '@/types';
import { bookingService, paymentService } from '@/services/api';
import { useBookingStore } from '@/stores/booking-store';

interface UseBookingReturn {
  booking: Booking | null;
  loading: boolean;
  error: string | null;
  createBooking: (data: CreateBookingRequest) => Promise<Booking | null>;
  initiatePayment: (bookingId: string, method: 'ecpay' | 'linepay') => Promise<void>;
  reset: () => void;
}

export function useBooking(): UseBookingReturn {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setCurrentBooking = useBookingStore((state) => state.setCurrentBooking);

  const createBooking = useCallback(async (data: CreateBookingRequest): Promise<Booking | null> => {
    try {
      setLoading(true);
      setError(null);
      const newBooking = await bookingService.createBooking(data);
      setBooking(newBooking);
      setCurrentBooking(newBooking);
      return newBooking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立預訂失敗';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setCurrentBooking]);

  const initiatePayment = useCallback(async (bookingId: string, method: 'ecpay' | 'linepay') => {
    try {
      setLoading(true);
      setError(null);
      const { paymentUrl } = await paymentService.createPayment(bookingId, method);
      
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error('無法取得付款連結');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立付款失敗';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setBooking(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    booking,
    loading,
    error,
    createBooking,
    initiatePayment,
    reset,
  };
}

export function useBookingQuery(reference: string | undefined) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    if (!reference) return;

    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getBookingByReference(reference);
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '查詢預訂失敗');
    } finally {
      setLoading(false);
    }
  }, [reference]);

  return { booking, loading, error, refetch: fetchBooking };
}
