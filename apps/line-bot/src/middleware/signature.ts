import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';

/**
 * 驗證 LINE Webhook 簽章
 */
export function signatureMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // 測試環境可跳過驗證
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_SIGNATURE === 'true') {
      console.log('⚠️ 跳過簽章驗證（開發模式）');
      next();
      return;
    }

    const signature = req.headers['x-line-signature'] as string;
    
    if (!signature) {
      console.error('缺少 X-Line-Signature Header');
      res.status(401).json({ error: 'Missing signature' });
      return;
    }

    if (!config.line.channelSecret) {
      console.error('未設定 LINE Channel Secret');
      res.status(500).json({ error: 'Configuration error' });
      return;
    }

    // 計算預期簽章
    const body = (req as any).rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', config.line.channelSecret)
      .update(body)
      .digest('base64');

    // 比對簽章
    if (signature !== expectedSignature) {
      console.error('簽章驗證失敗');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    next();
  } catch (error) {
    console.error('簽章驗證錯誤:', error);
    res.status(500).json({ error: 'Signature verification failed' });
  }
}
