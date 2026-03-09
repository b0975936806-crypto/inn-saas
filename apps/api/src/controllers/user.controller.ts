import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';

// 驗證 Schema
const createUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).optional(),
  role: z.enum(['owner', 'manager', 'staff', 'customer']).default('customer'),
  lineUserId: z.string().optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
});

const queryUsersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  role: z.enum(['owner', 'manager', 'staff', 'customer']).optional(),
  search: z.string().optional(),
});

/**
 * 查詢用戶列表
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const query = queryUsersSchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      role: req.query.role,
      search: req.query.search,
    });

    const prisma = req.tenant!.prisma;
    const skip = (query.page - 1) * query.limit;

    const where: any = { isActive: true };
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { phone: { contains: query.search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          isActive: true,
          lineUserId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    });
  } catch (error) {
    console.error('查詢用戶錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 取得單一用戶
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
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
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        lineUserId: true,
        createdAt: true,
        updatedAt: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            bookingNumber: true,
            checkInDate: true,
            checkOutDate: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '用戶不存在' },
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('取得用戶錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 建立用戶
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const validation = createUserSchema.safeParse(req.body);
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

    // 檢查 email 或 phone 是否已存在
    if (data.email || data.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          OR: [
            data.email ? { email: data.email } : {},
            data.phone ? { phone: data.phone } : {},
          ],
        },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_USER', message: 'Email 或電話已被使用' },
        });
        return;
      }
    }

    // 如果有密碼，進行雜湊
    let passwordHash = null;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: data.email,
        phone: data.phone,
        name: data.name,
        passwordHash,
        role: data.role,
        lineUserId: data.lineUserId,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('建立用戶錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '建立失敗' },
    });
  }
}

/**
 * 更新用戶
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '無效的 ID' },
      });
      return;
    }

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '資料格式錯誤', details: validation.error.errors },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const user = await prisma.user.update({
      where: { id },
      data: validation.data,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('更新用戶錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '更新失敗' },
    });
  }
}

/**
 * 刪除用戶（軟刪除）
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
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

    // 不能刪除自己
    if (req.user?.id === id) {
      res.status(400).json({
        success: false,
        error: { code: 'CANNOT_DELETE_SELF', message: '不能刪除自己的帳號' },
      });
      return;
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: '用戶已停用',
    });
  } catch (error) {
    console.error('刪除用戶錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '刪除失敗' },
    });
  }
}

/**
 * 用戶登入
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '資料格式錯誤', details: validation.error.errors },
      });
      return;
    }

    const { email, phone, password } = validation.data;

    if (!email && !phone) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: '請提供 Email 或電話' },
      });
      return;
    }

    const prisma = req.tenant!.prisma;
    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ],
      },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' },
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' },
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email || undefined,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '登入失敗' },
    });
  }
}

/**
 * 變更密碼
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '資料格式錯誤', details: validation.error.errors },
      });
      return;
    }

    const { currentPassword, newPassword } = validation.data;
    const userId = req.user!.id;

    const prisma = req.tenant!.prisma;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_PASSWORD', message: '無法變更密碼' },
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: '目前密碼錯誤' },
      });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({
      success: true,
      message: '密碼已更新',
    });
  } catch (error) {
    console.error('變更密碼錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '變更失敗' },
    });
  }
}

/**
 * 取得當前用戶資訊
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const prisma = req.tenant!.prisma;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            bookingNumber: true,
            checkInDate: true,
            checkOutDate: true,
            status: true,
            totalAmount: true,
            room: {
              select: {
                roomNumber: true,
                roomType: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '用戶不存在' },
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('取得當前用戶錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}
