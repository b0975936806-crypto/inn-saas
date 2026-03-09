'use client';

import { useState } from 'react';
import { Users, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-picker';
import { Select } from '@/components/ui/select';
import { useBookingStore } from '@/stores/booking-store';
import { useRouter } from 'next/navigation';

export function SearchBox() {
  const router = useRouter();
  const dateRange = useBookingStore((state) => state.dateRange);
  const guestCount = useBookingStore((state) => state.guestCount);
  const setDateRange = useBookingStore((state) => state.setDateRange);
  const setGuestCount = useBookingStore((state) => state.setGuestCount);

  const [localRange, setLocalRange] = useState({
    from: dateRange?.from,
    to: dateRange?.to,
  });
  const [localGuests, setLocalGuests] = useState(guestCount.toString());

  const guestOptions = [
    { value: '1', label: '1 位成人' },
    { value: '2', label: '2 位成人' },
    { value: '3', label: '3 位成人' },
    { value: '4', label: '4 位成人' },
    { value: '5', label: '5 位成人' },
    { value: '6', label: '6 位成人' },
  ];

  const handleSearch = () => {
    if (localRange.from && localRange.to) {
      setDateRange({
        from: localRange.from,
        to: localRange.to,
      });
      setGuestCount(parseInt(localGuests, 10));
      router.push('/rooms');
    }
  };

  const isValid = localRange.from && localRange.to;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            入住 / 退房日期
          </label>
          <DateRangePicker
            range={localRange}
            onSelect={setLocalRange}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline h-4 w-4 mr-1" />
            入住人數
          </label>
          <Select
            value={localGuests}
            onChange={(e) => setLocalGuests(e.target.value)}
            options={guestOptions}
            className="w-full"
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleSearch}
          disabled={!isValid}
          className="w-full md:w-auto"
        >
          <Search className="h-5 w-5 mr-2" />
          搜尋空房
        </Button>
      </div>
    </div>
  );
}
