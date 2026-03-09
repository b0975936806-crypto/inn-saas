'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { BookingForm } from '@/components/booking/booking-form';
import { BookingSummary } from '@/components/booking/booking-summary';
import { PaymentMethodSelector } from '@/components/booking/payment-method';
import { useTenant } from '@/hooks/use-tenant';
import { useBooking } from '@/hooks/use-booking';
import { useBookingStore } from '@/stores/booking-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function BookingPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const { 
    dateRange, 
    guestCount, 
    selectedRoomType, 
    bookingStep,
    currentBooking,
    setBookingStep,
    nextStep,
    prevStep,
    setCurrentBooking,
  } = useBookingStore();

  const { 
    booking, 
    loading, 
    error, 
    createBooking, 
    initiatePayment,
    reset 
  } = useBooking();

  // 檢查必要資料
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to || !selectedRoomType) {
      router.push('/rooms');
    }
  }, [dateRange, selectedRoomType, router]);

  if (!dateRange?.from || !dateRange?.to || !selectedRoomType) {
    return null;
  }

  const handleBookingSubmit = async (formData: {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    specialRequests?: string;
  }) => {
    const newBooking = await createBooking({
      roomTypeId: selectedRoomType.id,
      checkInDate: dateRange.from!.toISOString(),
      checkOutDate: dateRange.to!.toISOString(),
      guestName: formData.guestName,
      guestEmail: formData.guestEmail,
      guestPhone: formData.guestPhone,
      guestCount,
      specialRequests: formData.specialRequests,
    });

    if (newBooking) {
      nextStep();
    }
  };

  const handlePaymentSelect = async (method: 'ecpay' | 'linepay') => {
    if (booking || currentBooking) {
      await initiatePayment((booking || currentBooking)!.id, method);
    }
  };

  const steps = [
    { number: 1, label: '填寫資料' },
    { number: 2, label: '選擇付款' },
    { number: 3, label: '完成預訂' },
  ];

  return (
    <MainLayout tenant={tenant}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">線上預訂</h1>
          
          {/* Stepper */}
          <div className="flex items-center gap-4">
            {steps.map((step, index) => (
              <>
                <div key={step.number} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      bookingStep >= step.number
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      bookingStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 max-w-16 ${
                      bookingStep > step.number ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            {bookingStep === 1 && (
              <BookingForm onSubmit={handleBookingSubmit} isLoading={loading} />
            )}

            {bookingStep === 2 && (booking || currentBooking) && (
              <PaymentMethodSelector
                booking={booking || currentBooking!}
                onSelect={handlePaymentSelect}
                isLoading={loading}
              />
            )}

            {bookingStep === 3 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">預訂成功！</h2>
                  <p className="text-gray-600 mb-6">
                    感謝您的預訂，我們已發送確認信至您的電子郵件。
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link href="/">
                      <Button variant="outline">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        返回首頁
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingSummary
                roomType={selectedRoomType}
                checkInDate={dateRange.from}
                checkOutDate={dateRange.to}
                guestCount={guestCount}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
