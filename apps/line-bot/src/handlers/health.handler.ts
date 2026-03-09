import { Request, Response } from 'express';
import { redisClient } from '../services/redis.service';

/**
 * 健康檢查
 */
export async function healthCheckHandler(req: Request, res: Response): Promise<void> {
  try {
    // 檢查 Redis 連線
    const redisHealthy = redisClient['client']?.status === 'ready';

    res.json({
      status: 'ok',
      service: 'line-bot',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checks: {
        redis: redisHealthy ? 'ok' : 'disconnected',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'line-bot',
      error: 'Health check failed',
    });
  }
}
