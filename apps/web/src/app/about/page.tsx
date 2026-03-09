'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { useTenant } from '@/hooks/use-tenant';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, Phone, Mail, Clock, Car, Bus, Train,
  HelpCircle, ChevronDown, Home, Heart, Star
} from 'lucide-react';
import { useState } from 'react';

// FAQ 項目
const faqItems = [
  {
    question: '入住和退房時間是什麼時候？',
    answer: '入住時間為下午 3:00 後，退房時間為上午 11:00 前。如需提前入住或延遲退房，請提前與我們聯繫，我們會盡量協助安排。',
  },
  {
    question: '是否提供早餐？',
    answer: '是的，我們提供免費的自助式早餐，供應時間為早上 7:00 至 10:00。早餐包含中西式選項，使用新鮮當地食材製作。',
  },
  {
    question: '可以攜帶寵物入住嗎？',
    answer: '很抱歉，目前我們的民宿暫不接受寵物入住，以維護住宿環境的品質和其他住客的權益。',
  },
  {
    question: '是否提供停車位？',
    answer: '是的，我們提供免費的私人停車場，供入住客人使用。請在預訂時告知車牌號碼，以便我們安排車位。',
  },
  {
    question: '如何取消或修改預訂？',
    answer: '您可以透過 LINE 官方帳號發送「取消 {訂單編號}」來取消預訂。入住前 3 天取消可全額退款，入住前 1-2 天取消收取 50% 費用，當天取消不予退款。',
  },
  {
    question: '是否提供接送服務？',
    answer: '我們提供車站接送服務（需另外收費），請在預訂時提前告知您的抵達時間，我們會安排專人接送。',
  },
];

// FAQ 折疊組件
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{question}</span>
        <ChevronDown 
          className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="pb-4 px-4 -mx-4">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function AboutPage() {
  const { tenant, loading } = useTenant();

  if (loading) {
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
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">關於我們</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            用心經營每一個細節，為您打造難忘的住宿體驗
          </p>
        </div>
      </section>

      {/* 民宿故事 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 圖片區 */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                {tenant?.coverImageUrl ? (
                  <img
                    src={tenant.coverImageUrl}
                    alt={tenant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <Home className="h-24 w-24 text-primary-400" />
                  </div>
                )}
              </div>
              {/* 裝飾元素 */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary-100 rounded-full -z-10" />
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-secondary-100 rounded-full -z-10" />
            </div>

            {/* 文字內容 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-primary-600" />
                <span className="text-primary-600 font-medium">我們的故事</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {tenant?.name || '歡迎來到我們的民宿'}
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  {tenant?.description || 
                    '我們的民宿成立於對旅遊的熱愛與對優質住宿的追求。每一位來到這裡的客人，都是我們珍貴的朋友。'}
                </p>
                <p>
                  我們精心設計每一個空間，從舒適的床鋪到溫馨的公共區域，
                  只為讓您在旅途中找到家的感覺。無論是獨自旅行、情侶出遊，
                  還是家庭度假，我們都能為您提供最適合的住宿選擇。
                </p>
                <p>
                  秉持著「賓至如歸」的理念，我們的團隊隨時準備為您提供貼心的服務，
                  讓您的每一次入住都成為美好的回憶。
                </p>
              </div>

              {/* 特色數據 */}
              <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">10+</div>
                  <div className="text-sm text-gray-500">年經營經驗</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">5000+</div>
                  <div className="text-sm text-gray-500">滿意住客</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">4.9</div>
                  <div className="text-sm text-gray-500">平均評分</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 交通資訊 */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary-600" />
              <span className="text-primary-600 font-medium">交通資訊</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">如何抵達</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 地圖 */}
            <Card className="overflow-hidden h-96 lg:h-auto">
              <div className="w-full h-full min-h-[300px] bg-gray-200 flex items-center justify-center">
                {tenant?.address ? (
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.703582038956!2d121.5654!3d25.0330!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDAxJzU4LjgiTiAxMjHCsDMzJzU1LjQiRQ!5e0!3m2!1szh-TW!2stw!4v1234567890`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale-[20%]"
                  />
                ) : (
                  <div className="text-center p-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">地圖載入中...</p>
                  </div>
                )}
              </div>
            </Card>

            {/* 交通方式 */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <Car className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">自行開車</h3>
                      <p className="text-gray-600 text-sm">
                        沿國道三號下交流道後，依指標行駛約 10 分鐘即可抵達。
                        民宿備有免費停車場，請放心駕車前來。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <Train className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">大眾運輸</h3>
                      <p className="text-gray-600 text-sm">
                        搭乘火車/高鐵至最近的車站，轉乘公車或計程車約 15 分鐘可達。
                        我們也提供付費接送服務，歡迎提前預約。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <Bus className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">接駁服務</h3>
                      <p className="text-gray-600 text-sm">
                        提供車站付費接送服務，單程每人 NT$200。
                        請在預訂時告知抵達時間，我們將安排專人接送。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 聯絡資訊 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-primary-600" />
              <span className="text-primary-600 font-medium">聯絡我們</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">有任何問題嗎？</h2>
            <p className="text-gray-600 mt-4">我們隨時為您服務，歡迎與我們聯繫</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">電話聯絡</h3>
                {tenant?.phone ? (
                  <a 
                    href={`tel:${tenant.phone}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {tenant.phone}
                  </a>
                ) : (
                  <p className="text-gray-500">請見官網</p>
                )}
                <p className="text-sm text-gray-500 mt-2">服務時間：09:00 - 21:00</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">電子郵件</h3>
                {tenant?.email ? (
                  <a 
                    href={`mailto:${tenant.email}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {tenant.email}
                  </a>
                ) : (
                  <p className="text-gray-500">請見官網</p>
                )}
                <p className="text-sm text-gray-500 mt-2">24小時內回覆</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">民宿地址</h3>
                <p className="text-gray-600">
                  {tenant?.address || '請聯繫我們取得地址'}
                </p>
                <p className="text-sm text-gray-500 mt-2">歡迎蒞臨</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 常見問題 FAQ */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-primary-600" />
              <span className="text-primary-600 font-medium">常見問題</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">FAQ</h2>
            <p className="text-gray-600 mt-4">快速找到您需要的答案</p>
          </div>

          <Card>
            <CardContent className="p-6">
              {faqItems.map((item, index) => (
                <FAQItem key={index} question={item.question} answer={item.answer} />
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
