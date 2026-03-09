import { RoomType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, calculateNights, formatDate } from '@/lib/utils';
import { Calendar, Users, Home } from 'lucide-react';

interface BookingSummaryProps {
  roomType: RoomType;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
}

export function BookingSummary({
  roomType,
  checkInDate,
  checkOutDate,
  guestCount,
}: BookingSummaryProps) {
  const nights = calculateNights(checkInDate, checkOutDate);
  const totalPrice = roomType.basePrice * nights;

  return (
    <Card>
      <CardHeader>
        <CardTitle>預訂摘要</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 房型資訊 */}
        <div className="flex gap-4">
          {roomType.images[0]?.url && (
            <img
              src={roomType.images[0].url}
              alt={roomType.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{roomType.name}</h3>
            <p className="text-sm text-gray-500">{roomType.description}</p>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* 入住資訊 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="flex-1">
              <span className="text-gray-600">入住日期：</span>
              <span className="font-medium">{formatDate(checkInDate)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="flex-1">
              <span className="text-gray-600">退房日期：</span>
              <span className="font-medium">{formatDate(checkOutDate)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-400" />
            <div className="flex-1">
              <span className="text-gray-600">入住人數：</span>
              <span className="font-medium">{guestCount} 位</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Home className="h-4 w-4 text-gray-400" />
            <div className="flex-1">
              <span className="text-gray-600">住宿晚數：</span>
              <span className="font-medium">{nights} 晚</span>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* 價格明細 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {formatPrice(roomType.basePrice)} × {nights} 晚
            </span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          
          <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
            <span>總計</span>
            <span className="text-primary-600">{formatPrice(totalPrice)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
