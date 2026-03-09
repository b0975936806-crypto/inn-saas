import Image from 'next/image';
import Link from 'next/link';
import { Users, Bed, Bath, Maximize, ArrowRight } from 'lucide-react';
import { RoomType } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';

interface RoomCardProps {
  roomType: RoomType;
  showDetails?: boolean;
}

export function RoomCard({ roomType, showDetails = true }: RoomCardProps) {
  const coverImage = roomType.images.find(img => img.isCover)?.url || roomType.images[0]?.url;

  const amenityIcons: Record<string, string> = {
    'wifi': 'WiFi',
    'tv': '電視',
    'ac': '冷氣',
    'fridge': '冰箱',
    'breakfast': '早餐',
    'parking': '停車位',
    'bathtub': '浴缸',
    'view': '景觀',
  };

  return (
    <Card hover className="h-full flex flex-col">
      {/* 圖片 */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-xl">
        {coverImage ? (
          <img
            src={coverImage}
            alt={roomType.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Bed className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="primary" size="sm">
            {formatPrice(roomType.basePrice)}/晚
          </Badge>
        </div>
      </div>

      <CardContent className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{roomType.name}</h3>
        
        {showDetails && (
          <>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>最多 {roomType.maxGuests} 人</span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{roomType.bedCount} 床</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{roomType.bathroomCount} 衛浴</span>
              </div>
            </div>

            {roomType.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {roomType.description}
              </p>
            )}

            {/* 設施標籤 */}
            <div className="flex flex-wrap gap-1.5">
              {roomType.amenities.slice(0, 4).map((amenity) => (
                <Badge key={amenity} variant="default" size="sm">
                  {amenityIcons[amenity] || amenity}
                </Badge>
              ))}
              {roomType.amenities.length > 4 && (
                <Badge variant="default" size="sm">
                  +{roomType.amenities.length - 4}
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        <Link href={`/rooms/${roomType.id}`} className="w-full">
          <Button variant="primary" className="w-full">
            查看詳情
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
