# LINE Bot 部署指南

## 前置需求

1. LINE Developer 帳號
2. LINE Messaging API Channel
3. Redis 伺服器
4. InnSaaS API 服務

## 設定步驟

### 1. LINE Developer Console 設定

1. 登入 [LINE Developers](https://developers.line.biz/)
2. 建立 Provider
3. 建立 Messaging API Channel
4. 記下以下資訊：
   - Channel ID
   - Channel Secret
   - Channel Access Token

### 2. Webhook URL 設定

在 LINE Developer Console → Messaging API → Webhook settings：

```
Webhook URL: https://bot.inn.yu.dopay.biz/webhook
```

啟用 "Use webhook"

### 3. Auto-reply 設定

建議關閉自動回覆功能：
- LINE Official Account Manager → 設定 → 回應設定
- 關閉「自動回覆訊息」
- 開啟「Webhook」

### 4. 環境變數設定

編輯 `apps/line-bot/.env`：

```bash
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
REDIS_HOST=localhost
REDIS_PORT=6379
API_BASE_URL=http://localhost:3000
INN_NAME=您的民宿名稱
SUPPORT_PHONE=02-12345678
```

### 5. Rich Menu 設定

執行 Rich Menu 設定腳本：

```bash
cd apps/line-bot
ts-node src/utils/setup-rich-menu.ts
```

或手動在 LINE Developer Console 建立 Rich Menu。

## Docker 部署

### 單獨部署 LINE Bot

```bash
cd apps/line-bot
docker build -t inn-saas-line-bot .
docker run -d \
  --name line-bot \
  -p 3001:3000 \
  --env-file .env \
  --network inn-network \
  inn-saas-line-bot
```

### 使用 Docker Compose 部署

```bash
cd ~/projects/inn-saas
docker-compose up -d line-bot
```

## 測試

### 1. 健康檢查

```bash
curl http://localhost:3001/health
```

### 2. Webhook 測試

```bash
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "type": "message",
      "replyToken": "test-token",
      "source": {"type": "user", "userId": "test-user"},
      "message": {"type": "text", "text": "查空房"}
    }]
  }'
```

### 3. ngrok 本機測試

```bash
# 安裝 ngrok
# 啟動 ngrok
ngrok http 3001

# 在 LINE Developer Console 設定 Webhook URL
# https://xxxxx.ngrok.io/webhook
```

## 監控與日誌

### 查看日誌

```bash
# Docker
docker logs -f line-bot

# Docker Compose
docker-compose logs -f line-bot
```

### 監控指標

- Redis 連線狀態
- Webhook 回應時間
- API 呼叫成功率

## 疑難排解

### 簽章驗證失敗

- 確認 `LINE_CHANNEL_SECRET` 正確
- 確認 Webhook URL 可公開存取
- 暫時設定 `SKIP_SIGNATURE=true` 用於測試

### Redis 連線失敗

- 確認 Redis 服務運行中
- 確認 `REDIS_HOST` 和 `REDIS_PORT` 正確
- 檢查防火牆設定

### API 呼叫失敗

- 確認 API 服務運行中
- 確認 `API_BASE_URL` 正確
- 檢查網路連線

## 生產環境檢查清單

- [ ] LINE Channel 憑證正確設定
- [ ] Webhook URL 使用 HTTPS
- [ ] Redis 有密碼保護
- [ ] 關閉 `SKIP_SIGNATURE`
- [ ] 設定 `NODE_ENV=production`
- [ ] 監控與警報設定
- [ ] 日誌收集設定

## 更新部署

```bash
# 拉取最新程式碼
git pull

# 重新建置
docker-compose build line-bot

# 重新部署
docker-compose up -d line-bot
```
