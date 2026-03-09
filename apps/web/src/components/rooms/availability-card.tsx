import { useState } from 'react';
import { RoomAvailability } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, calculateNights, formatDate } from '@/lib/utils';
import { Users, Bed, Check, ArrowRight } from 'lucide-react';
import { useBookingStore } from '@/stores/booking-store';
import { useRouter } from 'next/navigation';

interface AvailabilityCardProps {
  availability: RoomAvailability;
}

export function AvailabilityCard({ availability }: AvailabilityCardProps) {
  const router = useRouter();
  const { roomType, availableCount, pricePerNight, totalNights, totalPrice } = availability;
  const coverImage = roomType.images.find(img => img.isCover)?.url || roomType.images[0]?.url;
  
  const setSelectedRoomType = useBookingStore((state) => state.setSelectedRoomType);
  const dateRange = useBookingStore((state) => state.dateRange);

  const handleBook = () => {
    setSelectedRoomType(roomType);
    router.push('/booking');
  };

  return (
    <Card className="flex flex-col md:flex-row overflow-hidden">
      {/* 圖片區 */}
      <div className="md:w-1/3 relative">
        {coverImage ? (
          <img
            src={coverImage}
            alt={roomType.name}
            className="w-full h-48 md:h-full object-cover"
          />
        ) : (
          <div className="w-full h-48 md:h-full bg-gray-200 flex items-center justify-center">
            <Bed className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant={availableCount > 0 ? 'success' : 'danger'} size="sm">
            {availableCount > 0 ? `剩餘 ${availableCount} 間` : '已滿房'}
          </Badge>
        </div>
      </div>

      {/* 內容區 */}
      <div className="flex-1 flex flex-col">
        <CardContent className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{roomType.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {roomType.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>最多 {roomType.maxGuests} 人</span>
            </div>
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{roomType.bedCount} 床</span>
            </div>
          </div>

          {/* 設施 */}
          <div className="flex flex-wrap gap-1.5">
            {roomType.amenities.slice(0, 6).map((amenity) => (
              <Badge key={amenity} variant="default" size="sm">
                {amenity}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-gray-100">
          <div>
            <div className="text-sm text-gray-500">
              {formatPrice(pricePerNight)} × {totalNights} 晚
            </div>
            <div className="text-2xl font-bold text-primary-600">
              {formatPrice(totalPrice)}
            </div>
          </div>
          
          <Button
            variant="primary"
            onClick={handleBook}
            disabled={availableCount === 0}
          >
            立即預訂
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
