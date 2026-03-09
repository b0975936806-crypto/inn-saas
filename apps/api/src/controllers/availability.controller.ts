import { Request, Response } from 'express';
import { z } from 'zod';

// 驗證 Schema
const availabilityQuerySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).default(1),
  roomTypeId: z.number().int().optional(),
});

/**
 * 查詢空房
 */
export async function checkAvailability(req: Request, res: Response): Promise<void> {
  try {
    const validation = availabilityQuerySchema.safeParse({
      checkIn: req.query.checkIn,
      checkOut: req.query.checkOut,
      guests: req.query.guests ? parseInt(req.query.guests as string) : 1,
      roomTypeId: req.query.roomTypeId ? parseInt(req.query.roomTypeId as string) : undefined,
    });

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '資料格式錯誤', details: validation.error.errors },
      });
      return;
    }

    const { checkIn, checkOut, guests, roomTypeId } = validation.data;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // 驗證日期
    if (checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATES', message: '退房日期必須晚於入住日期' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;

    // 計算住宿天數
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // 查詢條件
    const roomTypeWhere: any = { isActive: true };
    if (roomTypeId) roomTypeWhere.id = roomTypeId;
    if (guests) roomTypeWhere.maxGuests = { gte: guests };

    // 取得所有符合條件的房間類型及其房間
    const roomTypes = await prisma.roomType.findMany({
      where: roomTypeWhere,
      include: {
        rooms: {
          where: { status: { in: ['available', 'occupied'] } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // 查詢在指定日期範圍內的預訂
    const bookings = await prisma.booking.findMany({
      where: {
        status: { notIn: ['cancelled'] },
        AND: [
          { checkInDate: { lt: checkOutDate } },
          { checkOutDate: { gt: checkInDate } },
        ],
      },
      select: {
        roomId: true,
        checkInDate: true,
        checkOutDate: true,
        status: true,
      },
    });

    // 找出被預訂的房間 ID
    const bookedRoomIds = new Set(bookings.map((b: any) => b.roomId));

    // 組裝結果
    const results = roomTypes.map((roomType: any) => {
      // 過濾出可用的房間
      const availableRooms = roomType.rooms.filter((room: any) => 
        room.status === 'available' && !bookedRoomIds.has(room.id)
      );

      return {
        id: roomType.id,
        name: roomType.name,
        description: roomType.description,
        basePrice: roomType.basePrice,
        maxGuests: roomType.maxGuests,
        bedType: roomType.bedType,
        amenities: roomType.amenities,
        images: roomType.images,
        availableCount: availableRooms.length,
        totalPrice: roomType.basePrice * nights,
        nights,
      };
    }).filter((rt: any) => rt.availableCount > 0);

    res.json({
      success: true,
      data: {
        checkIn,
        checkOut,
        guests,
        nights,
        availableRoomTypes: results,
      },
    });
  } catch (error) {
    console.error('查詢空房錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 查詢特定日期的所有房間狀態
 */
export async function getRoomStatusByDate(req: Request, res: Response): Promise<void> {
  try {
    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATE', message: '日期格式錯誤，應為 YYYY-MM-DD' },
      });
      return;
    }

    const queryDate = new Date(date);
    const prisma = req.tenant!.prisma;

    // 取得所有房間
    const rooms = await prisma.room.findMany({
      include: {
        roomType: true,
        bookings: {
          where: {
            status: { notIn: ['cancelled'] },
            AND: [
              { checkInDate: { lte: queryDate } },
              { checkOutDate: { gt: queryDate } },
            ],
          },
          select: {
            id: true,
            bookingNumber: true,
            guestName: true,
            status: true,
          },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });

    const results = rooms.map((room: any) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: {
        id: room.roomType.id,
        name: room.roomType.name,
        basePrice: room.roomType.basePrice,
      },
      status: room.bookings.length > 0 ? 'occupied' : room.status,
      currentBooking: room.bookings[0] || null,
    }));

    res.json({
      success: true,
      data: {
        date,
        rooms: results,
      },
    });
  } catch (error) {
    console.error('查詢房間狀態錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 查詢日期範圍內的預訂情況（行事曆用）
 */
export async function getAvailabilityCalendar(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate || 
        !/^\d{4}-\d{2}-\d{2}$/.test(startDate as string) || 
        !/^\d{4}-\d{2}-\d{2}$/.test(endDate as string)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATES', message: '請提供有效的開始和結束日期 (YYYY-MM-DD)' },
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const prisma = req.tenant!.prisma;

    // 取得所有房間
    const rooms = await prisma.room.findMany({
      include: {
        roomType: {
          select: {
            id: true,
            name: true,
            basePrice: true,
          },
        },
      },
    });

    // 取得日期範圍內的所有預訂
    const bookings = await prisma.booking.findMany({
      where: {
        status: { notIn: ['cancelled'] },
        AND: [
          { checkInDate: { lt: end } },
          { checkOutDate: { gt: start } },
        ],
      },
      select: {
        roomId: true,
        checkInDate: true,
        checkOutDate: true,
        status: true,
        guestName: true,
      },
    });

    // 產生日期範圍
    const dates: string[] = [];
    const current = new Date(start);
    while (current < end) {
      dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }

    // 組裝行事曆資料
    const calendar = rooms.map((room: any) => {
      const dateStatus = dates.map(dateStr => {
        const date = new Date(dateStr);
        const booking = bookings.find((b: any) => 
          b.roomId === room.id &&
          b.checkInDate <= date &&
          b.checkOutDate > date
        );

        return {
          date: dateStr,
          status: booking ? 'occupied' : room.status,
          booking: booking ? {
            guestName: booking.guestName,
            status: booking.status,
          } : null,
        };
      });

      return {
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        dates: dateStatus,
      };
    });

    res.json({
      success: true,
      data: {
        startDate,
        endDate,
        dates,
        calendar,
      },
    });
  } catch (error) {
    console.error('查詢行事曆錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}
