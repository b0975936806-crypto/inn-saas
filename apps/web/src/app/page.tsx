'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { SearchBox } from '@/components/rooms/search-box';
import { RoomCard } from '@/components/rooms/room-card';
import { useTenant } from '@/hooks/use-tenant';
import { useRoomTypes } from '@/hooks/use-rooms';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Clock, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();
  const { roomTypes, loading: roomsLoading } = useRoomTypes(tenant?.id);

  const featuredRooms = roomTypes.slice(0, 3);

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">無法載入民宿資訊</h1>
            <p className="text-gray-600">{tenantError || '請確認網址是否正確'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MainLayout tenant={tenant}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 overflow-hidden">
          {tenant.coverImageUrl && (
            <img
              src={tenant.coverImageUrl}
              alt={tenant.name}
              className="w-full h-full object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {tenant.name}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              {tenant.description || '享受舒適的住宿體驗，預訂您的理想假期'}
            </p>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-4 mb-8">
              {tenant.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{tenant.address}</span>
                </div>
              )}
              {tenant.checkInTime && tenant.checkOutTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>入住 {tenant.checkInTime} / 退房 {tenant.checkOutTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="max-w-4xl">
            <SearchBox />
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">精選房型</h2>
              <p className="text-gray-600">為您挑選最舒適的住宿選擇</p>
            </div>
            <Link href="/rooms">
              <Button variant="outline">
                查看全部
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {roomsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">載入房型中...</p>
            </div>
          ) : featuredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRooms.map((room) => (
                <RoomCard key={room.id} roomType={room} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">暫無可預訂房型</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Amenities Section */}
      {tenant.amenities && tenant.amenities.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">民宿設施</h2>
              <p className="text-gray-600">我們提供完善的設施，讓您有賓至如歸的感受</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {tenant.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex flex-col items-center p-4 bg-gray-50 rounded-xl"
                >
                  <Star className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm text-gray-700 text-center">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
