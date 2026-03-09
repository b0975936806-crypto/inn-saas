import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'inn-saas-secret';

// 擴展 Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email?: string;
        role: string;
      };
    }
  }
}

/**
 * JWT 認證 Middleware
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '缺少認證令牌',
      },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email?: string;
      role: string;
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '無效的認證令牌',
      },
    });
  }
}

/**
 * 產生 JWT 令牌
 */
export function generateToken(payload: {
  userId: number;
  email?: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * 角色權限檢查 Middleware
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未登入',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '權限不足',
        },
      });
      return;
    }

    next();
  };
}
