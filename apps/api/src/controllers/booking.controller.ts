import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';

// 驗證 Schema
const createBookingSchema = z.object({
  roomId: z.number().int(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestCount: z.number().int().min(1).default(1),
  guestName: z.string().min(1),
  guestPhone: z.string().min(1),
  guestEmail: z.string().email().optional(),
  specialRequests: z.string().optional(),
  userId: z.number().int().optional(),
  source: z.enum(['web', 'line', 'manual', 'ota']).default('manual'),
});

const updateBookingSchema = z.object({
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  guestCount: z.number().int().min(1).optional(),
  guestName: z.string().min(1).optional(),
  guestPhone: z.string().min(1).optional(),
  guestEmail: z.string().email().optional(),
  specialRequests: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded']).optional(),
  paymentMethod: z.enum(['ecpay', 'linepay', 'cash', 'transfer']).optional(),
});

const queryBookingsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']).optional(),
  roomId: z.number().int().optional(),
  checkInFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkInTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
});

/**
 * 產生預訂編號
 */
function generateBookingNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomInt(1000, 9999);
  return `BK${dateStr}${random}`;
}

/**
 * 計算住宿天數
 */
function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 查詢預訂列表
 */
export async function getBookings(req: Request, res: Response): Promise<void> {
  try {
    const query = queryBookingsSchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      status: req.query.status,
      roomId: req.query.roomId ? parseInt(req.query.roomId as string) : undefined,
      checkInFrom: req.query.checkInFrom,
      checkInTo: req.query.checkInTo,
      search: req.query.search,
    });

    const prisma = req.tenant!.prisma;
    const skip = (query.page - 1) * query.limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.roomId) where.roomId = query.roomId;
    if (query.checkInFrom || query.checkInTo) {
      where.checkInDate = {};
      if (query.checkInFrom) where.checkInDate.gte = new Date(query.checkInFrom);
      if (query.checkInTo) where.checkInDate.lte = new Date(query.checkInTo);
    }
    if (query.search) {
      where.OR = [
        { bookingNumber: { contains: query.search } },
        { guestName: { contains: query.search } },
        { guestPhone: { contains: query.search } },
        { guestEmail: { contains: query.search } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          room: {
            include: {
              roomType: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    });
  } catch (error) {
    console.error('查詢預訂錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 取得單一預訂
 */
export async function getBookingById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '無效的 ID' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '預訂不存在' },
      });
      return;
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    console.error('取得預訂錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 根據編號取得預訂
 */
export async function getBookingByNumber(req: Request, res: Response): Promise<void> {
  try {
    const { bookingNumber } = req.params;

    const prisma = req.tenant!.prisma;
    const booking = await prisma.booking.findUnique({
      where: { bookingNumber },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '預訂不存在' },
      });
      return;
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    console.error('取得預訂錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 建立預訂
 */
export async function createBooking(req: Request, res: Response): Promise<void> {
  try {
    const validation = createBookingSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '資料格式錯誤', details: validation.error.errors },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      res.status(404).json({
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: '租戶不存在' },
      });
      return;
    }

    const data = validation.data;
    const nights = calculateNights(data.checkInDate, data.checkOutDate);

    if (nights <= 0) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATES', message: '退房日期必須晚於入住日期' },
      });
      return;
    }

    // 檢查房間是否存在
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: { roomType: true },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: '房間不存在' },
      });
      return;
    }

    // 檢查日期衝突
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: { notIn: ['cancelled'] },
        AND: [
          { checkInDate: { lt: new Date(data.checkOutDate) } },
          { checkOutDate: { gt: new Date(data.checkInDate) } },
        ],
      },
    });

    if (conflictingBooking) {
      res.status(409).json({
        success: false,
        error: { code: 'DATE_CONFLICT', message: '該日期區間已被預訂' },
      });
      return;
    }

    // 計算總金額
    const totalAmount = room.roomType.basePrice * nights;

    // 取得或建立用戶
    let userId = data.userId;
    if (!userId) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.guestEmail },
            { phone: data.guestPhone },
          ],
        },
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            tenantId: tenant.id,
            name: data.guestName,
            email: data.guestEmail,
            phone: data.guestPhone,
            role: 'customer',
          },
        });
        userId = newUser.id;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        tenantId: tenant.id,
        userId: userId!,
        roomId: data.roomId,
        checkInDate: new Date(data.checkInDate),
        checkOutDate: new Date(data.checkOutDate),
        nights,
        guestCount: data.guestCount,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        guestEmail: data.guestEmail,
        specialRequests: data.specialRequests,
        totalAmount,
        source: data.source,
      },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    console.error('建立預訂錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '建立預訂失敗' },
    });
  }
}

/**
 * 更新預訂
 */
export async function updateBooking(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '無效的 ID' },
      });
      return;
    }

    const validation = updateBookingSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '資料格式錯誤', details: validation.error.errors },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { room: { include: { roomType: true } } },
    });

    if (!existingBooking) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '預訂不存在' },
      });
      return;
    }

    const data = validation.data;

    // 如果更新日期，重新計算天數和金額
    let nights = existingBooking.nights;
    let totalAmount = existingBooking.totalAmount;

    if (data.checkInDate || data.checkOutDate) {
      const checkIn = data.checkInDate || existingBooking.checkInDate.toISOString().slice(0, 10);
      const checkOut = data.checkOutDate || existingBooking.checkOutDate.toISOString().slice(0, 10);
      nights = calculateNights(checkIn, checkOut);

      if (nights <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATES', message: '退房日期必須晚於入住日期' },
        });
        return;
      }

      totalAmount = existingBooking.room.roomType.basePrice * nights;

      // 檢查日期衝突（排除自己）
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          roomId: existingBooking.roomId,
          status: { notIn: ['cancelled'] },
          id: { not: id },
          AND: [
            { checkInDate: { lt: new Date(checkOut) } },
            { checkOutDate: { gt: new Date(checkIn) } },
          ],
        },
      });

      if (conflictingBooking) {
        res.status(409).json({
          success: false,
          error: { code: 'DATE_CONFLICT', message: '該日期區間已被預訂' },
        });
        return;
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...data,
        checkInDate: data.checkInDate ? new Date(data.checkInDate) : undefined,
        checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : undefined,
        nights,
        totalAmount,
      },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    console.error('更新預訂錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '更新失敗' },
    });
  }
}

/**
 * 取消預訂
 */
export async function cancelBooking(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '無效的 ID' },
      });
      return;
    }

    const { reason } = req.body;

    const prisma = req.tenant!.prisma;
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '預訂不存在' },
      });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CANCELLED', message: '預訂已取消' },
      });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        paymentStatus: booking.paymentStatus === 'paid' ? 'refunded' : 'pending',
      },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: '預訂已取消',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    console.error('取消預訂錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '取消失敗' },
    });
  }
}

/**
 * 辦理入住
 */
export async function checkInBooking(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '無效的 ID' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '預訂不存在' },
      });
      return;
    }

    if (booking.status !== 'confirmed') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: '只能為已確認的預訂辦理入住' },
      });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'checked_in' },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // 更新房間狀態
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'occupied' },
    });

    res.json({
      success: true,
      message: '入住完成',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    console.error('辦理入住錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '辦理入住失敗' },
    });
  }
}

/**
 * 辦理退房
 */
export async function checkOutBooking(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '無效的 ID' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '預訂不存在' },
      });
      return;
    }

    if (booking.status !== 'checked_in') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: '只能為已入住的預訂辦理退房' },
      });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'checked_out' },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // 更新房間狀態
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'available' },
    });

    res.json({
      success: true,
      message: '退房完成',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    console.error('辦理退房錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '辦理退房失敗' },
    });
  }
}
