'use client';

import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { useTenant } from '@/hooks/use-tenant';
import { useRoomType } from '@/hooks/use-rooms';
import { useBookingStore } from '@/stores/booking-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-picker';
import { Select } from '@/components/ui/select';
import { formatPrice, calculateNights } from '@/lib/utils';
import { 
  Users, Bed, Bath, Maximize, Check, ArrowLeft, Calendar, 
  Wifi, Tv, Wind, Coffee, Car, Droplets, Mountain 
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const amenityIcons: Record<string, React.ReactNode> = {
  'wifi': <Wifi className="h-5 w-5" />,
  'tv': <Tv className="h-5 w-5" />,
  'ac': <Wind className="h-5 w-5" />,
  'fridge': <Droplets className="h-5 w-5" />,
  'breakfast': <Coffee className="h-5 w-5" />,
  'parking': <Car className="h-5 w-5" />,
  'bathtub': <Droplets className="h-5 w-5" />,
  'view': <Mountain className="h-5 w-5" />,
};

const amenityLabels: Record<string, string> = {
  'wifi': '免費 WiFi',
  'tv': '平面電視',
  'ac': '冷暖氣',
  'fridge': '冰箱',
  'breakfast': '早餐',
  'parking': '停車位',
  'bathtub': '浴缸',
  'view': '景觀',
};

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomTypeId = params.id as string;
  
  const { tenant } = useTenant();
  const { roomType, loading, error } = useRoomType(roomTypeId);
  
  const dateRange = useBookingStore((state) => state.dateRange);
  const guestCount = useBookingStore((state) => state.guestCount);
  const setDateRange = useBookingStore((state) => state.setDateRange);
  const setGuestCount = useBookingStore((state) => state.setGuestCount);
  const setSelectedRoomType = useBookingStore((state) => state.setSelectedRoomType);

  const [localRange, setLocalRange] = useState({
    from: dateRange?.from,
    to: dateRange?.to,
  });
  const [localGuests, setLocalGuests] = useState(guestCount.toString());

  if (loading) {
    return (
      <MainLayout tenant={tenant}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">載入房型資訊中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !roomType) {
    return (
      <MainLayout tenant={tenant}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">房型不存在</h1>
              <p className="text-gray-600 mb-6">{error || '無法找到該房型資訊'}</p>
              <Link href="/rooms">
                <Button variant="primary">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回房型列表
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const coverImage = roomType.images.find(img => img.isCover) || roomType.images[0];
  const otherImages = roomType.images.filter(img => img.id !== coverImage?.id);

  const nights = localRange.from && localRange.to 
    ? calculateNights(localRange.from, localRange.to) 
    : 0;
  const totalPrice = roomType.basePrice * nights;

  const handleBook = () => {
    if (localRange.from && localRange.to) {
      setDateRange({ from: localRange.from, to: localRange.to });
      setGuestCount(parseInt(localGuests, 10));
      setSelectedRoomType(roomType);
      router.push('/booking');
    }
  };

  const guestOptions = Array.from({ length: roomType.maxGuests }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1} 位成人`,
  }));

  return (
    <MainLayout tenant={tenant}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-primary-600">首頁</Link></li>
            <li>/</li>
            <li><Link href="/rooms" className="hover:text-primary-600">房型介紹</Link></li>
            <li>/</li>
            <li className="text-gray-900">{roomType.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 aspect-video rounded-xl overflow-hidden bg-gray-100">
                {coverImage ? (
                  <img
                    src={coverImage.url}
                    alt={roomType.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bed className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </div>
              {otherImages.slice(0, 4).map((img) => (
                <div key={img.id} className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={img.url}
                    alt={roomType.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Room Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{roomType.name}</h1>
              
              {roomType.description && (
                <p className="text-gray-600 mb-6">{roomType.description}</p>
              )}

              {/* Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-primary-600" />
                  <div>
                    <div className="text-sm text-gray-500">最多入住</div>
                    <div className="font-semibold">{roomType.maxGuests} 人</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Bed className="h-5 w-5 text-primary-600" />
                  <div>
                    <div className="text-sm text-gray-500">床數</div>
                    <div className="font-semibold">{roomType.bedCount} 床</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Bath className="h-5 w-5 text-primary-600" />
                  <div>
                    <div className="text-sm text-gray-500">衛浴</div>
                    <div className="font-semibold">{roomType.bathroomCount} 間</div>
                  </div>
                </div>
                {roomType.squareMeters && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Maximize className="h-5 w-5 text-primary-600" />
                    <div>
                      <div className="text-sm text-gray-500">坪數</div>
                      <div className="font-semibold">{roomType.squareMeters} ㎡</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">房間設施</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {roomType.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="text-primary-600">
                        {amenityIcons[amenity] || <Check className="h-5 w-5" />}
                      </div>
                      <span className="text-gray-700">{amenityLabels[amenity] || amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-primary-600">
                  {formatPrice(roomType.basePrice)}
                </span>
                <span className="text-gray-500">/晚</span>
              </div>

              <div className="space-y-4">
                <div>
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

                {nights > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{formatPrice(roomType.basePrice)} × {nights} 晚</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                      <span>總計</span>
                      <span className="text-primary-600">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleBook}
                  disabled={!localRange.from || !localRange.to}
                  className="w-full"
                >
                  立即預訂
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
