import { useState, useEffect, useCallback } from 'react';
import { RoomType, RoomAvailability, RoomFilter } from '@/types';
import { roomService } from '@/services/api';
import { useBookingStore } from '@/stores/booking-store';

export function useRoomTypes(tenantId: string | undefined) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoomTypes() {
      if (!tenantId) return;
      
      try {
        setLoading(true);
        const data = await roomService.getRoomTypes(tenantId);
        setRoomTypes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入房型失敗');
      } finally {
        setLoading(false);
      }
    }

    loadRoomTypes();
  }, [tenantId]);

  return { roomTypes, loading, error, refetch: () => setRoomTypes([]) };
}

export function useRoomAvailability(tenantId: string | undefined, filter: RoomFilter) {
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!tenantId || !filter.checkInDate || !filter.checkOutDate) {
      setAvailability([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await roomService.checkAvailability(tenantId, filter);
      setAvailability(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '查詢空房失敗');
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filter]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return { availability, loading, error, refetch: fetchAvailability };
}

export function useRoomType(roomTypeId: string | undefined) {
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoomType() {
      if (!roomTypeId) return;

      try {
        setLoading(true);
        const data = await roomService.getRoomTypeById(roomTypeId);
        setRoomType(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入房型詳情失敗');
      } finally {
        setLoading(false);
      }
    }

    loadRoomType();
  }, [roomTypeId]);

  return { roomType, loading, error };
}

export function useBookingFilters() {
  const dateRange = useBookingStore((state) => state.dateRange);
  const guestCount = useBookingStore((state) => state.guestCount);
  const setDateRange = useBookingStore((state) => state.setDateRange);
  const setGuestCount = useBookingStore((state) => state.setGuestCount);

  const [localCheckIn, setLocalCheckIn] = useState<Date | undefined>(
    dateRange?.from
  );
  const [localCheckOut, setLocalCheckOut] = useState<Date | undefined>(
    dateRange?.to
  );
  const [localGuestCount, setLocalGuestCount] = useState(guestCount);

  const applyFilters = useCallback(() => {
    if (localCheckIn && localCheckOut) {
      setDateRange({ from: localCheckIn, to: localCheckOut });
      setGuestCount(localGuestCount);
      return true;
    }
    return false;
  }, [localCheckIn, localCheckOut, localGuestCount, setDateRange, setGuestCount]);

  return {
    localCheckIn,
    setLocalCheckIn,
    localCheckOut,
    setLocalCheckOut,
    localGuestCount,
    setLocalGuestCount,
    applyFilters,
  };
}
