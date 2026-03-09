import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Booking } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { CheckCircle, Clock, CreditCard } from 'lucide-react';

interface PaymentMethodSelectorProps {
  booking: Booking;
  onSelect: (method: 'ecpay' | 'linepay') => void;
  isLoading?: boolean;
}

export function PaymentMethodSelector({
  booking,
  onSelect,
  isLoading,
}: PaymentMethodSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>選擇付款方式</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 訂單摘要 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">訂單編號</span>
            <span className="font-mono font-medium">{booking.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">入住日期</span>
            <span>{formatDate(booking.checkInDate)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>付款金額</span>
            <span className="text-primary-600">{formatPrice(booking.totalPrice)}</span>
          </div>
        </div>

        {/* 付款選項 */}
        <div className="space-y-3">
          <button
            onClick={() => onSelect('ecpay')}
            disabled={isLoading}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
          >
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">綠界</span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">綠界科技 ECPay</div>
              <div className="text-sm text-gray-500">支援信用卡、ATM轉帳、超商代碼</div>
            </div>
            <CreditCard className="h-5 w-5 text-gray-400" />
          </button>

          <button
            onClick={() => onSelect('linepay')}
            disabled={isLoading}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
          >
            <div className="w-12 h-12 bg-[#06C755] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">LINE</span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">LINE Pay</div>
              <div className="text-sm text-gray-500">使用 LINE Pay 快速付款</div>
            </div>
            <CreditCard className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
          <Clock className="h-4 w-4" />
          <span>請在 30 分鐘內完成付款，逾期訂單將自動取消</span>
        </div>
      </CardContent>
    </Card>
  );
}
