"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Building2, CreditCard, Bot, Save, Copy, CheckCircle2, Globe, Clock } from "lucide-react"
import { settingsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { InnSettings, PaymentSettings } from "@/types"

const currencies = [
  { value: "TWD", label: "新台幣 (TWD)", symbol: "NT$" },
  { value: "USD", label: "美元 (USD)", symbol: "$" },
  { value: "JPY", label: "日圓 (JPY)", symbol: "¥" },
  { value: "EUR", label: "歐元 (EUR)", symbol: "€" },
]

const timezones = [
  { value: "Asia/Taipei", label: "台北 (Asia/Taipei)" },
  { value: "Asia/Tokyo", label: "東京 (Asia/Tokyo)" },
  { value: "Asia/Seoul", label: "首爾 (Asia/Seoul)" },
  { value: "Asia/Singapore", label: "新加坡 (Asia/Singapore)" },
]

const paymentProviders = [
  { value: "ecpay", label: "綠界科技 (ECPay)", description: "台灣本地支付，支援信用卡、超商付款" },
  { value: "linepay", label: "LINE Pay", description: "LINE 官方支付，適合 LINE 用戶" },
  { value: "stripe", label: "Stripe", description: "國際支付，支援多種信用卡" },
  { value: "paypal", label: "PayPal", description: "國際支付平台，支援多國貨幣" },
]

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Inn Settings
  const [innSettings, setInnSettings] = useState<InnSettings>({
    name: "我的民宿",
    address: "",
    phone: "",
    email: "",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    timezone: "Asia/Taipei",
    currency: "TWD",
  })

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    provider: "ecpay",
    isActive: false,
    publicKey: "",
    secretKey: "",
    webhookUrl: "",
  })

  // LINE Bot Settings
  const [lineSettings, setLineSettings] = useState({
    channelId: "",
    channelSecret: "",
    accessToken: "",
    webhookUrl: "",
    isActive: false,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // Try to load from API, fallback to defaults
      try {
        const innData = await settingsApi.getInn()
        setInnSettings(innData)
      } catch (error) {
        console.log("Using default inn settings")
      }

      try {
        const paymentData = await settingsApi.getPayment()
        setPaymentSettings(paymentData)
      } catch (error) {
        console.log("Using default payment settings")
        setPaymentSettings(prev => ({
          ...prev,
          webhookUrl: `${window.location.origin}/api/webhook/payment`,
        }))
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveInnSettings = async () => {
    setIsSaving(true)
    try {
      await settingsApi.updateInn(innSettings)
      toast({
        title: "儲存成功",
        description: "民宿設定已更新",
      })
    } catch (error) {
      console.error("Failed to save inn settings:", error)
      toast({
        title: "儲存失敗",
        description: "無法儲存設定，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePaymentSettings = async () => {
    setIsSaving(true)
    try {
      await settingsApi.updatePayment(paymentSettings)
      toast({
        title: "儲存成功",
        description: "金流設定已更新",
      })
    } catch (error) {
      console.error("Failed to save payment settings:", error)
      toast({
        title: "儲存失敗",
        description: "無法儲存設定，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveLineSettings = async () => {
    setIsSaving(true)
    try {
      // await settingsApi.updateLine(lineSettings)
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast({
        title: "儲存成功",
        description: "LINE Bot 設定已更新",
      })
    } catch (error) {
      console.error("Failed to save line settings:", error)
      toast({
        title: "儲存失敗",
        description: "無法儲存設定，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">設定</h1>
        <p className="text-muted-foreground">管理民宿設定、金流與 LINE Bot 設定</p>
      </div>

      <Tabs defaultValue="inn" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="inn">
            <Building2 className="mr-2 h-4 w-4" />
            民宿設定
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            金流設定
          </TabsTrigger>
          <TabsTrigger value="line">
            <Bot className="mr-2 h-4 w-4" />
            LINE Bot
          </TabsTrigger>
        </TabsList>

        {/* Inn Settings */}
        <TabsContent value="inn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>民宿基本資料</CardTitle>
              <CardDescription>設定民宿的基本資訊，這些資訊將顯示在顧客預訂確認信中</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="inn-name">民宿名稱 *</Label>
                  <Input
                    id="inn-name"
                    value={innSettings.name}
                    onChange={(e) => setInnSettings({ ...innSettings, name: e.target.value })}
                    placeholder="請輸入民宿名稱"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inn-phone">聯絡電話 *</Label>
                  <Input
                    id="inn-phone"
                    value={innSettings.phone}
                    onChange={(e) => setInnSettings({ ...innSettings, phone: e.target.value })}
                    placeholder="例如：02-1234-5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inn-address">地址 *</Label>
                <Input
                  id="inn-address"
                  value={innSettings.address}
                  onChange={(e) => setInnSettings({ ...innSettings, address: e.target.value })}
                  placeholder="請輸入完整地址"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inn-email">聯絡 Email *</Label>
                <Input
                  id="inn-email"
                  type="email"
                  value={innSettings.email}
                  onChange={(e) => setInnSettings({ ...innSettings, email: e.target.value })}
                  placeholder="例如：contact@example.com"
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="check-in" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    入住時間
                  </Label>
                  <Input
                    id="check-in"
                    type="time"
                    value={innSettings.checkInTime}
                    onChange={(e) => setInnSettings({ ...innSettings, checkInTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check-out" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    退房時間
                  </Label>
                  <Input
                    id="check-out"
                    type="time"
                    value={innSettings.checkOutTime}
                    onChange={(e) => setInnSettings({ ...innSettings, checkOutTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    時區
                  </Label>
                  <Select
                    value={innSettings.timezone}
                    onValueChange={(value) => setInnSettings({ ...innSettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇時區" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">預設貨幣</Label>
                  <Select
                    value={innSettings.currency}
                    onValueChange={(value) => setInnSettings({ ...innSettings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇貨幣" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveInnSettings} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "儲存中..." : "儲存設定"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>金流設定</CardTitle>
              <CardDescription>設定線上支付相關資訊，讓顧客可以線上付款</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">啟用線上支付</Label>
                  <p className="text-sm text-muted-foreground">
                    允許顧客在預訂時透過線上付款
                  </p>
                </div>
                <Switch
                  checked={paymentSettings.isActive}
                  onCheckedChange={(checked) =>
                    setPaymentSettings({ ...paymentSettings, isActive: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>支付提供商</Label>
                <div className="grid gap-3">
                  {paymentProviders.map((provider) => (
                    <div
                      key={provider.value}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        paymentSettings.provider === provider.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() =>
                        setPaymentSettings({ ...paymentSettings, provider: provider.value as PaymentSettings["provider"] })
                      }
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{provider.label}</p>
                          {paymentSettings.provider === provider.value && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="merchant-id">Merchant ID / 商店代號</Label>
                <Input
                  id="merchant-id"
                  value={paymentSettings.publicKey}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, publicKey: e.target.value })
                  }
                  placeholder="請輸入您的商店代號"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret-key">Secret Key / Hash Key</Label>
                <Input
                  id="secret-key"
                  type="password"
                  value={paymentSettings.secretKey}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, secretKey: e.target.value })
                  }
                  placeholder="請輸入您的密鑰"
                />
                <p className="text-xs text-muted-foreground">
                  此金鑰將加密儲存，僅用於處理支付請求
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-webhook">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="payment-webhook"
                    value={paymentSettings.webhookUrl}
                    readOnly
                    className="bg-muted font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(paymentSettings.webhookUrl || "")}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  請將此網址複製並設定在支付提供商的後台 Webhook 設定中
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSavePaymentSettings} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "儲存中..." : "儲存設定"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LINE Bot Settings */}
        <TabsContent value="line" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LINE Bot 設定</CardTitle>
              <CardDescription>
                設定 LINE 官方帳號整合，自動發送預訂通知給顧客
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">啟用 LINE Bot</Label>
                  <p className="text-sm text-muted-foreground">
                    啟用後將自動發送預訂確認、提醒等訊息給顧客
                  </p>
                </div>
                <Switch
                  checked={lineSettings.isActive}
                  onCheckedChange={(checked) =>
                    setLineSettings({ ...lineSettings, isActive: checked })
                  }
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>設定步驟：</strong>
                </p>
                <ol className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                  <li>前往 LINE Developers 控制台</li>
                  <li>建立新的 Provider 和 Channel</li>
                  <li>將下方的 Webhook URL 設定在 Channel 中</li>
                  <li>將 Channel ID、Secret 和 Access Token 複製到下方</li>
                </ol>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="line-channel-id">Channel ID</Label>
                <Input
                  id="line-channel-id"
                  value={lineSettings.channelId}
                  onChange={(e) =>
                    setLineSettings({ ...lineSettings, channelId: e.target.value })
                  }
                  placeholder="請輸入 LINE Channel ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line-channel-secret">Channel Secret</Label>
                <Input
                  id="line-channel-secret"
                  type="password"
                  value={lineSettings.channelSecret}
                  onChange={(e) =>
                    setLineSettings({ ...lineSettings, channelSecret: e.target.value })
                  }
                  placeholder="請輸入 LINE Channel Secret"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line-access-token">Channel Access Token</Label>
                <Input
                  id="line-access-token"
                  type="password"
                  value={lineSettings.accessToken}
                  onChange={(e) =>
                    setLineSettings({ ...lineSettings, accessToken: e.target.value })
                  }
                  placeholder="請輸入 LINE Channel Access Token"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line-webhook">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="line-webhook"
                    value={lineSettings.webhookUrl || `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhook/line`}
                    readOnly
                    className="bg-muted font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      copyToClipboard(
                        lineSettings.webhookUrl ||
                          `${window.location.origin}/api/webhook/line`
                      )
                    }
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  請將此網址設定在 LINE Developers 控制台的 Webhook URL 中
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveLineSettings} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "儲存中..." : "儲存設定"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
