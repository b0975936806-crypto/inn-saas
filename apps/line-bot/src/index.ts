import express from 'express';
import dotenv from 'dotenv';
import { signatureMiddleware } from './middleware/signature';
import { webhookHandler } from './handlers/webhook.handler';
import { healthCheckHandler } from './handlers/health.handler';
import { config } from './config';
import { redisClient } from './services/redis.service';

dotenv.config();

const app = express();

// 中間件
app.use(express.json({ 
  verify: (req: any, res, buf) => {
    // 保存原始 body 用於簽章驗證
    req.rawBody = buf;
  }
}));

// 健康檢查
app.get('/health', healthCheckHandler);

// LINE Webhook 端點
app.post('/webhook', signatureMiddleware, webhookHandler);

// 啟動服務
const PORT = config.port;

async function startServer() {
  try {
    // 連接 Redis
    await redisClient.connect();
    console.log('✅ Redis 連線成功');

    app.listen(PORT, () => {
      console.log(`🤖 LINE Bot 服務啟動於埠 ${PORT}`);
      console.log(`📊 健康檢查: http://localhost:${PORT}/health`);
      console.log(`📩 Webhook: http://localhost:${PORT}/webhook`);
    });
  } catch (error) {
    console.error('❌ 服務啟動失敗:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await redisClient.disconnect();
  process.exit(0);
});

startServer();
