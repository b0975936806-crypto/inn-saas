# InnSaaS LINE Bot

InnSaaS 民宿管理系統的 LINE Bot 服務，提供預訂查詢、房間預訂等互動功能。

## 功能

- 🤖 **智能對話**：自然語言處理，輕鬆查詢空房
- 📅 **日期查詢**：支援多種日期格式輸入
- 🏨 **房型預訂**：完整的預訂流程
- 📋 **預訂管理**：查詢、取消預訂
- 💬 **客服轉接**：人工客服支援

## 指令列表

| 指令 | 說明 | 範例 |
|------|------|------|
| 查空房 | 開始查詢空房 | 查空房 |
| 房型/價格 | 查看房型與價格 | 房型 |
| 我的預訂 | 查詢預訂記錄 | 我的預訂 0912345678 |
| 取消預訂 | 取消現有預訂 | 取消預訂 BK202503090001 |
| 人工客服 | 聯絡真人客服 | 人工客服 |
| 幫助 | 顯示指令說明 | 幫助 |

## 開發

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 建置
npm run build

# 啟動
npm run start
```

## 環境變數

複製 `.env.example` 為 `.env` 並設定：

- `LINE_CHANNEL_SECRET` - LINE Channel Secret
- `LINE_CHANNEL_ACCESS_TOKEN` - LINE Channel Access Token
- `REDIS_HOST` - Redis 主機
- `API_BASE_URL` - API 基礎 URL

## Webhook URL

設定 LINE Developer Console：
```
https://your-domain.com/webhook
```

## 架構

```
src/
├── config/           # 設定檔
├── flex-messages/    # LINE Flex Message 設計
├── handlers/         # 事件處理器
│   ├── webhook.handler.ts
│   ├── message.handler.ts
│   ├── postback.handler.ts
│   ├── follow.handler.ts
│   └── commands.handler.ts
├── middleware/       # 中間件
├── services/         # 服務層
│   ├── line.service.ts
│   ├── api.service.ts
│   └── redis.service.ts
├── types/            # TypeScript 類型
├── utils/            # 工具函數
└── index.ts          # 入口點
```

## 會話狀態

使用 Redis 儲存用戶會話，狀態包括：

- `idle` - 閒置
- `awaiting_checkin_date` - 等待入住日期
- `awaiting_checkout_date` - 等待退房日期
- `awaiting_room_type` - 等待房型選擇
- `awaiting_guest_name` - 等待客人姓名
- `awaiting_guest_phone` - 等待客人電話
- `awaiting_confirmation` - 等待確認

會話逾時時間：30 分鐘

## Docker

```bash
docker build -t inn-saas-line-bot .
docker run -p 3001:3001 --env-file .env inn-saas-line-bot
```
