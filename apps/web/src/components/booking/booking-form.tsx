'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateBookingRequest } from '@/types';

const bookingFormSchema = z.object({
  guestName: z.string().min(2, '請輸入姓名'),
  guestEmail: z.string().email('請輸入有效的電子郵件'),
  guestPhone: z.string().regex(/^09\d{8}$/, '請輸入有效的手機號碼（09開頭的10碼）'),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  isLoading?: boolean;
}

export function BookingForm({ onSubmit, isLoading }: BookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>填寫預訂資訊</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="入住人姓名"
            placeholder="請輸入真實姓名"
            error={errors.guestName?.message}
            {...register('guestName')}
          />

          <Input
            label="電子郵件"
            type="email"
            placeholder="example@email.com"
            error={errors.guestEmail?.message}
            {...register('guestEmail')}
          />

          <Input
            label="聯絡電話"
            placeholder="0912345678"
            error={errors.guestPhone?.message}
            {...register('guestPhone')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              特殊需求（選填）
            </label>
            <textarea
              {...register('specialRequests')}
              rows={3}
              placeholder="例如：需要嬰兒床、延遲退房等"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            確認預訂
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
