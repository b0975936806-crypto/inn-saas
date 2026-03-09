import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// 請求驗證 Schema
const createTenantSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  theme: z.string().default('minimal'),
  primaryColor: z.string().default('#4A90D9'),
});

const updateTenantSchema = createTenantSchema.partial().omit({ slug: true });

/**
 * 取得當前租戶資訊
 */
export async function getCurrentTenant(req: Request, res: Response): Promise<void> {
  try {
    const prisma = req.tenant!.prisma;
    
    const tenant = await prisma.tenant.findFirst({
      include: {
        roomTypes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        lineBotSettings: true,
      },
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: '租戶不存在' },
      });
      return;
    }

    res.json({
      success: true,
      data: { tenant },
    });
  } catch (error) {
    console.error('取得租戶資訊錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}

/**
 * 更新租戶資訊
 */
export async function updateTenant(req: Request, res: Response): Promise<void> {
  try {
    const validation = updateTenantSchema.safeParse(req.body);
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

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: validation.data,
    });

    res.json({
      success: true,
      data: { tenant: updatedTenant },
    });
  } catch (error) {
    console.error('更新租戶錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '更新失敗' },
    });
  }
}

/**
 * 更新金流設定
 */
export async function updatePaymentSettings(req: Request, res: Response): Promise<void> {
  try {
    const schema = z.object({
      ecpayEnabled: z.boolean().optional(),
      ecpayMerchantId: z.string().optional(),
      ecpayHashKey: z.string().optional(),
      ecpayHashIv: z.string().optional(),
      ecpayTestMode: z.boolean().optional(),
      linepayEnabled: z.boolean().optional(),
      linepayChannelId: z.string().optional(),
      linepayChannelSecret: z.string().optional(),
      linepayChannelAccessToken: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);
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

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: validation.data,
    });

    res.json({
      success: true,
      data: { 
        paymentSettings: {
          ecpayEnabled: updatedTenant.ecpayEnabled,
          ecpayMerchantId: updatedTenant.ecpayMerchantId,
          ecpayTestMode: updatedTenant.ecpayTestMode,
          linepayEnabled: updatedTenant.linepayEnabled,
          linepayChannelId: updatedTenant.linepayChannelId,
        }
      },
    });
  } catch (error) {
    console.error('更新金流設定錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '更新失敗' },
    });
  }
}

/**
 * 更新 LINE Bot 設定
 */
export async function updateLineBotSettings(req: Request, res: Response): Promise<void> {
  try {
    const schema = z.object({
      channelId: z.string().optional(),
      channelSecret: z.string().min(1),
      channelAccessToken: z.string().min(1),
      welcomeMessage: z.string().default('歡迎光臨！請輸入「查空房」查詢可訂房間。'),
      autoReplyEnabled: z.boolean().default(true),
    });

    const validation = schema.safeParse(req.body);
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

    const lineBotSettings = await prisma.lineBotSettings.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        ...validation.data,
      },
      update: validation.data,
    });

    res.json({
      success: true,
      data: { lineBotSettings },
    });
  } catch (error) {
    console.error('更新 LINE Bot 設定錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '更新失敗' },
    });
  }
}

/**
 * 公開取得租戶基本資訊（前台用）
 */
export async function getPublicTenantInfo(req: Request, res: Response): Promise<void> {
  try {
    const prisma = req.tenant!.prisma;
    
    const tenant = await prisma.tenant.findFirst({
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        email: true,
        address: true,
        theme: true,
        primaryColor: true,
        logoUrl: true,
      },
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: '租戶不存在' },
      });
      return;
    }

    res.json({
      success: true,
      data: { tenant },
    });
  } catch (error) {
    console.error('取得公開租戶資訊錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: '查詢失敗' },
    });
  }
}
