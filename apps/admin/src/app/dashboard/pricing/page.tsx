"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DollarSign, Plus, Trash2, Calendar, Edit, Tag } from "lucide-react"
import type { RoomType, RoomTypePricing, SpecialPrice } from "@/types"
import { pricingApi, roomApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// Form schemas
const pricingSchema = z.object({
  weekdayPrice: z.number().min(0, "價格必須大於0"),
  weekendPrice: z.number().min(0, "價格必須大於0"),
  holidayPrice: z.number().min(0, "價格必須大於0").optional(),
})

const specialPriceSchema = z.object({
  roomTypeId: z.string().min(1, "請選擇房型"),
  startDate: z.string().min(1, "請選擇開始日期"),
  endDate: z.string().min(1, "請選擇結束日期"),
  price: z.number().min(0, "價格必須大於0"),
  description: z.string().optional(),
}).refine((data) => {
  return new Date(data.startDate) <= new Date(data.endDate)
}, {
  message: "結束日期必須在開始日期之後",
  path: ["endDate"],
})

type PricingFormData = z.infer<typeof pricingSchema>
type SpecialPriceFormData = z.infer<typeof specialPriceSchema>

export default function PricingPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [roomTypePricing, setRoomTypePricing] = useState<Record<string, RoomTypePricing>>({})
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSpecialPriceOpen, setIsSpecialPriceOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedSpecialPrice, setSelectedSpecialPrice] = useState<SpecialPrice | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const pricingForm = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      weekdayPrice: 0,
      weekendPrice: 0,
      holidayPrice: 0,
    },
  })

  const specialPriceForm = useForm<SpecialPriceFormData>({
    resolver: zodResolver(specialPriceSchema),
    defaultValues: {
      roomTypeId: "",
      startDate: "",
      endDate: "",
      price: 0,
      description: "",
    },
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [roomsData, specialPricesData] = await Promise.all([
        roomApi.getAll(),
        pricingApi.getSpecialPrices(),
      ])
      
      // Extract unique room types from rooms
      const uniqueRoomTypes = roomsData.reduce((acc: RoomType[], room) => {
        if (room.roomType && !acc.find(rt => rt.id === room.roomType?.id)) {
          acc.push(room.roomType)
        }
        return acc
      }, [])
      
      setRoomTypes(uniqueRoomTypes)
      setSpecialPrices(specialPricesData)

      // Fetch pricing for each room type
      const pricingMap: Record<string, RoomTypePricing> = {}
      await Promise.all(
        uniqueRoomTypes.map(async (rt) => {
          try {
            const pricing = await pricingApi.getRoomTypePricing(rt.id)
            pricingMap[rt.id] = pricing
          } catch (error) {
            // If no pricing exists yet, create a default one
            pricingMap[rt.id] = {
              id: "",
              roomTypeId: rt.id,
              weekdayPrice: rt.basePrice,
              weekendPrice: rt.basePrice,
              holidayPrice: rt.basePrice,
              updatedAt: new Date().toISOString(),
            }
          }
        })
      )
      setRoomTypePricing(pricingMap)
    } catch (error) {
      console.error("Failed to fetch pricing data:", error)
      toast({
        title: "載入失敗",
        description: "無法載入價格資料，請檢查網路連線",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditPricing = (roomType: RoomType) => {
    setSelectedRoomType(roomType)
    const pricing = roomTypePricing[roomType.id]
    pricingForm.reset({
      weekdayPrice: pricing?.weekdayPrice || roomType.basePrice,
      weekendPrice: pricing?.weekendPrice || roomType.basePrice,
      holidayPrice: pricing?.holidayPrice || roomType.basePrice,
    })
    setIsEditOpen(true)
  }

  const handleSavePricing = async (data: PricingFormData) => {
    if (!selectedRoomType) return
    
    setIsProcessing(true)
    try {
      await pricingApi.updateRoomTypePricing(selectedRoomType.id, data)
      await fetchData()
      setIsEditOpen(false)
      toast({
        title: "儲存成功",
        description: `${selectedRoomType.name} 的價格設定已更新`,
      })
    } catch (error) {
      console.error("Failed to save pricing:", error)
      toast({
        title: "儲存失敗",
        description: "無法更新價格設定，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateSpecialPrice = async (data: SpecialPriceFormData) => {
    setIsProcessing(true)
    try {
      await pricingApi.createSpecialPrice(data)
      await fetchData()
      setIsSpecialPriceOpen(false)
      specialPriceForm.reset()
      toast({
        title: "新增成功",
        description: "特殊日期定價已新增",
      })
    } catch (error) {
      console.error("Failed to create special price:", error)
      toast({
        title: "新增失敗",
        description: "無法新增特殊日期定價，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteSpecialPrice = async () => {
    if (!selectedSpecialPrice) return
    
    setIsProcessing(true)
    try {
      await pricingApi.deleteSpecialPrice(selectedSpecialPrice.id)
      await fetchData()
      setIsDeleteOpen(false)
      setSelectedSpecialPrice(null)
      toast({
        title: "刪除成功",
        description: "特殊日期定價已刪除",
      })
    } catch (error) {
      console.error("Failed to delete special price:", error)
      toast({
        title: "刪除失敗",
        description: "無法刪除特殊日期定價，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatPrice = (price: number) => `NT$ ${price.toLocaleString()}`

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const sameMonth = startDate.getMonth() === endDate.getMonth()
    const sameYear = startDate.getFullYear() === endDate.getFullYear()
    
    if (sameMonth && sameYear) {
      return `${startDate.getFullYear()}/${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getDate()}`
    }
    return `${start} ~ ${end}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">價格設定</h1>
          <p className="text-muted-foreground">管理房型定價與特殊日期價格</p>
        </div>
        <Button onClick={() => {
          specialPriceForm.reset()
          setIsSpecialPriceOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          新增特殊定價
        </Button>
      </div>

      <Tabs defaultValue="base" className="w-full">
        <TabsList>
          <TabsTrigger value="base">基礎定價</TabsTrigger>
          <TabsTrigger value="special">特殊日期定價</TabsTrigger>
        </TabsList>

        {/* Base Pricing Tab */}
        <TabsContent value="base" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>房型基礎定價</CardTitle>
              <CardDescription>
                設定各房型的平日、假日價格。假日預設為週五、週六。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>房型</TableHead>
                      <TableHead>平日價格</TableHead>
                      <TableHead>假日價格</TableHead>
                      <TableHead>特殊假日價格</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomTypes.map((roomType) => {
                      const pricing = roomTypePricing[roomType.id]
                      return (
                        <TableRow key={roomType.id}>
                          <TableCell className="font-medium">
                            {roomType.name}
                            <div className="text-sm text-muted-foreground">
                              最多 {roomType.maxGuests} 人
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatPrice(pricing?.weekdayPrice || roomType.basePrice)}
                          </TableCell>
                          <TableCell>
                            {formatPrice(pricing?.weekendPrice || roomType.basePrice)}
                          </TableCell>
                          <TableCell>
                            {pricing?.holidayPrice && pricing.holidayPrice !== (pricing?.weekendPrice || roomType.basePrice) ? (
                              formatPrice(pricing.holidayPrice)
                            ) : (
                              <span className="text-muted-foreground">- -</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPricing(roomType)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              編輯
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline">平日</Badge>
              <span>週日 ~ 週四</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">假日</Badge>
              <span>週五、週六</span>
            </div>
          </div>
        </TabsContent>

        {/* Special Pricing Tab */}
        <TabsContent value="special" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>特殊日期定價</CardTitle>
              <CardDescription>
                設定特定日期區間的特殊價格，如春節、連假等。特殊價格優先於基礎定價。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : specialPrices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>房型</TableHead>
                      <TableHead>日期區間</TableHead>
                      <TableHead>價格</TableHead>
                      <TableHead>說明</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialPrices.map((sp) => (
                      <TableRow key={sp.id}>
                        <TableCell className="font-medium">
                          {sp.roomType?.name || "未知房型"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDateRange(sp.startDate, sp.endDate)}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {formatPrice(sp.price)}
                        </TableCell>
                        <TableCell>
                          {sp.description || (
                            <span className="text-muted-foreground">- -</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSpecialPrice(sp)
                              setIsDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">尚未設定特殊日期定價</p>
                  <Button onClick={() => {
                    specialPriceForm.reset()
                    setIsSpecialPriceOpen(true)
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    新增第一筆
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Pricing Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯定價 - {selectedRoomType?.name}</DialogTitle>
            <DialogDescription>
              設定此房型的平日、假日與特殊假日價格
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={pricingForm.handleSubmit(handleSavePricing)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weekdayPrice">平日價格（週日~週四）</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="weekdayPrice"
                  type="number"
                  className="pl-10"
                  {...pricingForm.register("weekdayPrice", { valueAsNumber: true })}
                />
              </div>
              {pricingForm.formState.errors.weekdayPrice && (
                <p className="text-sm text-destructive">{pricingForm.formState.errors.weekdayPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekendPrice">假日價格（週五、週六）</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="weekendPrice"
                  type="number"
                  className="pl-10"
                  {...pricingForm.register("weekendPrice", { valueAsNumber: true })}
                />
              </div>
              {pricingForm.formState.errors.weekendPrice && (
                <p className="text-sm text-destructive">{pricingForm.formState.errors.weekendPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="holidayPrice">特殊假日價格（選填）</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="holidayPrice"
                  type="number"
                  className="pl-10"
                  {...pricingForm.register("holidayPrice", { valueAsNumber: true })}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                若未設定，將使用假日價格
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? "儲存中..." : "儲存設定"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Special Price Dialog */}
      <Dialog open={isSpecialPriceOpen} onOpenChange={setIsSpecialPriceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增特殊日期定價</DialogTitle>
            <DialogDescription>
              設定特定日期區間的特殊價格
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={specialPriceForm.handleSubmit(handleCreateSpecialPrice)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sp-roomType">選擇房型</Label>
              <select
                id="sp-roomType"
                className="w-full px-3 py-2 border rounded-md"
                {...specialPriceForm.register("roomTypeId")}
              >
                <option value="">請選擇房型</option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
              {specialPriceForm.formState.errors.roomTypeId && (
                <p className="text-sm text-destructive">{specialPriceForm.formState.errors.roomTypeId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sp-startDate">開始日期</Label>
                <Input
                  id="sp-startDate"
                  type="date"
                  {...specialPriceForm.register("startDate")}
                />
                {specialPriceForm.formState.errors.startDate && (
                  <p className="text-sm text-destructive">{specialPriceForm.formState.errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sp-endDate">結束日期</Label>
                <Input
                  id="sp-endDate"
                  type="date"
                  {...specialPriceForm.register("endDate")}
                />
                {specialPriceForm.formState.errors.endDate && (
                  <p className="text-sm text-destructive">{specialPriceForm.formState.errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sp-price">特殊價格</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sp-price"
                  type="number"
                  className="pl-10"
                  placeholder="輸入價格"
                  {...specialPriceForm.register("price", { valueAsNumber: true })}
                />
              </div>
              {specialPriceForm.formState.errors.price && (
                <p className="text-sm text-destructive">{specialPriceForm.formState.errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sp-description">說明（選填）</Label>
              <Input
                id="sp-description"
                placeholder="例如：春節、連假"
                {...specialPriceForm.register("description")}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSpecialPriceOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? "新增中..." : "新增"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除這筆特殊日期定價嗎？此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSpecialPrice}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? "刪除中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}