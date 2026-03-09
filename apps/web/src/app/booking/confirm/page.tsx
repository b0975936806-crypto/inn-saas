'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { useTenant } from '@/hooks/use-tenant';
import { paymentService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react';
import Link from 'next/link';

export default function BookingConfirmPage() {
  const { tenant } = useTenant();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('確認付款狀態中...');

  useEffect(() => {
    const checkPayment = async () => {
      const transactionId = searchParams.get('transactionId');
      
      if (!transactionId) {
        setStatus('failed');
        setMessage('無法確認付款狀態');
        return;
      }

      try {
        // 檢查付款狀態
        const result = await paymentService.checkPaymentStatus(transactionId);
        
        if (result.status === 'paid' || result.status === 'success') {
          setStatus('success');
          setMessage('付款成功！您的預訂已確認。');
        } else {
          setStatus('failed');
          setMessage('付款未完成，請重新預訂。');
        }
      } catch (error) {
        setStatus('failed');
        setMessage('確認付款狀態時發生錯誤');
      }
    };

    checkPayment();
  }, [searchParams]);

  return (
    <MainLayout tenant={tenant}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 text-primary-600 mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">處理中</h1>
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <Badge variant="success" className="mb-4">付款成功</Badge>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">預訂確認</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <p className="text-sm text-gray-500 mb-6">
                  確認信已發送至您的電子郵件，請查收。
                </p>
              </>
            )}

            {status === 'failed' && (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <Badge variant="danger" className="mb-4">付款失敗</Badge>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">預訂未完成</h1>
                <p className="text-gray-600 mb-6">{message}</p>
              </>
            )}

            <Link href="/">
              <Button variant="primary" size="lg">
                <Home className="h-5 w-5 mr-2" />
                返回首頁
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
