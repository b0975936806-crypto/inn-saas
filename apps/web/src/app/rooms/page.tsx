'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { SearchBox } from '@/components/rooms/search-box';
import { AvailabilityCard } from '@/components/rooms/availability-card';
import { useTenant } from '@/hooks/use-tenant';
import { useRoomAvailability } from '@/hooks/use-rooms';
import { useBookingStore } from '@/stores/booking-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RoomsPage() {
  const { tenant, loading: tenantLoading } = useTenant();
  const dateRange = useBookingStore((state) => state.dateRange);
  const guestCount = useBookingStore((state) => state.guestCount);

  const { availability, loading, error, refetch } = useRoomAvailability(
    tenant?.id,
    {
      checkInDate: dateRange?.from?.toISOString(),
      checkOutDate: dateRange?.to?.toISOString(),
      guestCount,
    }
  );

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

  return (
    <MainLayout tenant={tenant}>
      {/* Header */}
      <div className="bg-primary-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">房型介紹</h1>
          <p className="text-white/80">選擇適合您的房型，享受舒適的住宿體驗</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBox />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!dateRange?.from || !dateRange?.to ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">請選擇入住日期</h2>
              <p className="text-gray-600 mb-4">
                選擇您的入住和退房日期，查看可預訂的房型
              </p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">查詢空房中...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">查詢失敗</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refetch} variant="primary">重新查詢</Button>
            </CardContent>
          </Card>
        ) : availability.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">無空房</h2>
              <p className="text-gray-600 mb-4">
                您選擇的日期區間沒有可預訂的房間，請嘗試其他日期
              </p>
              <Button onClick={refetch} variant="outline">重新查詢</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                找到 <span className="font-semibold text-gray-900">{availability.length}</span> 種可預訂房型
              </p>
              <p className="text-sm text-gray-500">
                入住：{dateRange.from.toLocaleDateString('zh-TW')} | 
                退房：{dateRange.to.toLocaleDateString('zh-TW')} | 
                {guestCount} 位成人
              </p>
            </div>
            <div className="space-y-6">
              {availability.map((item) => (
                <AvailabilityCard key={item.roomTypeId} availability={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
