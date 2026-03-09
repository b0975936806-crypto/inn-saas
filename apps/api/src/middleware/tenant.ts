import { Request, Response, NextFunction } from 'express';
import { getTenantClient } from '../lib/tenant-connection';

// 擴展 Express Request 類型
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        slug: string;
        prisma: Awaited<ReturnType<typeof getTenantClient>>;
      };
    }
  }
}

/**
 * 租戶識別 Middleware
 * 從子域名或 Header 識別租戶，並建立資料庫連線
 */
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. 從子域名識別租戶
    const host = req.headers.host || '';
    const subdomainMatch = host.match(/^(?<tenant>[^.]+)\./);
    let tenantSlug = subdomainMatch?.groups?.tenant;

    // 2. 如果沒有子域名，從 Header 取得
    if (!tenantSlug) {
      tenantSlug = req.headers['x-tenant-id'] as string;
    }

    // 3. 驗證租戶存在
    if (!tenantSlug || tenantSlug === 'www') {
      res.status(400).json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: '無法識別租戶，請確認子域名或 X-Tenant-ID Header',
        },
      });
      return;
    }

    // 4. 建立租戶資料庫連線
    const prisma = await getTenantClient(tenantSlug);

    // 5. 附加到請求上下文
    req.tenant = {
      slug: tenantSlug,
      prisma,
    };

    next();
  } catch (error) {
    console.error('租戶 Middleware 錯誤:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TENANT_CONNECTION_ERROR',
        message: '租戶資料庫連線失敗',
      },
    });
  }
}
