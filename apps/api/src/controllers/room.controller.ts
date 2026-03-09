import { Request, Response } from 'express';
import { z } from 'zod';

// 驗證 Schema
const createRoomTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  basePrice: z.number().int().min(0),
  maxGuests: z.number().int().min(1).default(2),
  bedType: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});

const updateRoomTypeSchema = createRoomTypeSchema.partial();

const createRoomSchema = z.object({
  roomTypeId: z.number().int(),
  roomNumber: z.string().min(1).max(50),
  floor: z.number().int().optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).default('available'),
  notes: z.string().optional(),
});

const updateRoomSchema = createRoomSchema.partial().omit({ roomTypeId: true });

// ==================== RoomType Controllers ====================

/**
 * 取得所有房間類型
 */
export async function getAllRoomTypes(req: Request, res: Response): Promise<void> {
  try {
    const prisma = req.tenant!.prisma;
    const { includeInactive } = req.query;

    const roomTypes = await prisma.roomType.findMany({
      where: includeInactive === 'true' ? {} : { isActive: true },
      include: {
        rooms: {
          select: {
            id: true,
            roomNumber: true,
            status: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      success: true,
      data: { roomTypes },
    });
  } catch (error) {
    console.error('取得房間類型錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 取得單一房間類型
 */
export async function getRoomTypeById(req: Request, res: Response): Promise<void> {
  try {
    const prisma = req.tenant!.prisma;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '無效的 ID' },
      });
      return;
    }

    const roomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        rooms: true,
      },
    });

    if (!roomType) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '房間類型不存在' },
      });
      return;
    }

    res.json({
      success: true,
      data: { roomType },
    });
  } catch (error) {
    console.error('取得房間類型錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 建立房間類型
 */
export async function createRoomType(req: Request, res: Response): Promise<void> {
  try {
    const validation = createRoomTypeSchema.safeParse(req.body);
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

    const roomType = await prisma.roomType.create({
      data: {
        ...validation.data,
        tenantId: tenant.id,
      },
    });

    res.status(201).json({
      success: true,
      data: { roomType },
    });
  } catch (error) {
    console.error('建立房間類型錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '建立失敗' },
    });
  }
}

/**
 * 更新房間類型
 */
export async function updateRoomType(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '無效的 ID' },
      });
      return;
    }

    const validation = updateRoomTypeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '資料格式錯誤', details: validation.error.errors },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const roomType = await prisma.roomType.update({
      where: { id },
      data: validation.data,
    });

    res.json({
      success: true,
      data: { roomType },
    });
  } catch (error) {
    console.error('更新房間類型錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '更新失敗' },
    });
  }
}

/**
 * 刪除房間類型（軟刪除）
 */
export async function deleteRoomType(req: Request, res: Response): Promise<void> {
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
    
    // 檢查是否還有關聯的房間
    const roomCount = await prisma.room.count({
      where: { roomTypeId: id },
    });

    if (roomCount > 0) {
      res.status(400).json({
        success: false,
        error: { code: 'HAS_ROOMS', message: '無法刪除，此房型下還有房間' },
      });
      return;
    }

    await prisma.roomType.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: '房間類型已刪除',
    });
  } catch (error) {
    console.error('刪除房間類型錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '刪除失敗' },
    });
  }
}

// ==================== Room Controllers ====================

/**
 * 取得所有房間
 */
export async function getAllRooms(req: Request, res: Response): Promise<void> {
  try {
    const prisma = req.tenant!.prisma;
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status;

    const rooms = await prisma.room.findMany({
      where,
      include: {
        roomType: true,
      },
      orderBy: { roomNumber: 'asc' },
    });

    res.json({
      success: true,
      data: { rooms },
    });
  } catch (error) {
    console.error('取得房間錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 取得單一房間
 */
export async function getRoomById(req: Request, res: Response): Promise<void> {
  try {
    const prisma = req.tenant!.prisma;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '無效的 ID' },
      });
      return;
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        roomType: true,
        bookings: {
          where: {
            status: { notIn: ['cancelled'] },
            checkOutDate: { gte: new Date() },
          },
          orderBy: { checkInDate: 'asc' },
        },
      },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '房間不存在' },
      });
      return;
    }

    res.json({
      success: true,
      data: { room },
    });
  } catch (error) {
    console.error('取得房間錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 建立房間
 */
export async function createRoom(req: Request, res: Response): Promise<void> {
  try {
    const validation = createRoomSchema.safeParse(req.body);
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

    // 檢查房間編號是否已存在
    const existingRoom = await prisma.room.findFirst({
      where: {
        tenantId: tenant.id,
        roomNumber: validation.data.roomNumber,
      },
    });

    if (existingRoom) {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_ROOM_NUMBER', message: '房間編號已存在' },
      });
      return;
    }

    const room = await prisma.room.create({
      data: {
        ...validation.data,
        tenantId: tenant.id,
      },
      include: {
        roomType: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { room },
    });
  } catch (error) {
    console.error('建立房間錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '建立失敗' },
    });
  }
}

/**
 * 更新房間
 */
export async function updateRoom(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '無效的 ID' },
      });
      return;
    }

    const validation = updateRoomSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '資料格式錯誤', details: validation.error.errors },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const room = await prisma.room.update({
      where: { id },
      data: validation.data,
      include: {
        roomType: true,
      },
    });

    res.json({
      success: true,
      data: { room },
    });
  } catch (error) {
    console.error('更新房間錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '更新失敗' },
    });
  }
}

/**
 * 刪除房間
 */
export async function deleteRoom(req: Request, res: Response): Promise<void> {
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

    // 檢查是否有進行中的預訂
    const activeBooking = await prisma.booking.findFirst({
      where: {
        roomId: id,
        status: { in: ['pending', 'confirmed', 'checked_in'] },
      },
    });

    if (activeBooking) {
      res.status(400).json({
        success: false,
        error: { code: 'HAS_ACTIVE_BOOKINGS', message: '無法刪除，此房間還有進行中的預訂' },
      });
      return;
    }

    await prisma.room.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '房間已刪除',
    });
  } catch (error) {
    console.error('刪除房間錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '刪除失敗' },
    });
  }
}
