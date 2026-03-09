# InnSaaS 專案文件更新

**更新日期：** 2026-03-09  
**更新內容：** 部署架構變更（Docker → PM2）

---

## 🔄 重要變更記錄

### 2026-03-09: 部署架構重大變更

**變更原因：**
- 避免 Docker 重新部署時服務中斷的問題
- 與 CampFlow 專案統一架構（PM2）
- 單一主機統一管理，簡化維護

**變更內容：**

| 項目 | 舊方案 | 新方案 |
|------|--------|--------|
| **應用管理** | Docker Compose | PM2 |
| **反向代理** | Docker Nginx | 系統 Nginx |
| **資料庫** | Docker PostgreSQL/Redis | 系統 PostgreSQL/Redis |
| **部署方式** | `docker-compose up -d` | `pm2 start` |
| **更新流程** | `docker-compose down && up` | `pm2 reload`（無縫）|

**端口分配更新：**

| 應用 | 舊端口 | 新端口 |
|------|--------|--------|
| inn-api | 3000 (Docker) | 3101 |
| inn-web | 3000 (Docker) | 3102 |
| inn-admin | 3001 (Docker) | 3103 |
| inn-linebot | 3000 (Docker) | 3104 |

---

## 📐 當前系統架構

```
單一主機部署（與 CampFlow 共用）
├─ Nginx (反向代理)
│  ├─ camp.yu.dopay.biz → :3002
│  ├─ inn.yu.dopay.biz → :3102
│  ├─ admin.inn.yu.dopay.biz → :3103
│  ├─ api.inn.yu.dopay.biz → :3101
│  └─ bot.inn.yu.dopay.biz → :3104
│
├─ PM2 (Node 22)
│  ├─ campflow-api (3001)
│  ├─ campflow-web (3002)
│  ├─ inn-api (3101)
│  ├─ inn-web (3102)
│  ├─ inn-admin (3103)
│  └─ inn-linebot (3104)
│
├─ PostgreSQL (系統)
│  ├─ campflow (CampFlow)
│  ├─ campflow_inn_master (InnSaaS)
│  └─ campflow_inn_tenant_* (租戶)
│
└─ Redis (系統)
   ├─ DB 0 (CampFlow)
   └─ DB 1 (InnSaaS)
```

---

## 📁 文件清單

| 文件 | 說明 | 位置 |
|------|------|------|
| DEPLOY-SPEC.md | 完整部署規格 | `./docs/DEPLOY-SPEC.md` |
| ecosystem.config.js | PM2 配置 | `./ecosystem.config.js` |
| DEPLOY.md | 快速部署指南 | `./DEPLOY.md` |
| README.md | 專案說明 | `./README.md` |

---

## 🚀 快速開始

### 開發環境

```bash
# 安裝依賴
cd apps/api && npm install
cd apps/web && npm install
cd apps/admin && npm install
cd apps/line-bot && npm install

# 開發模式
npm run dev  # 各應用目錄執行
```

### 生產部署

```bash
# 1. 建置
npm run build  # 各應用目錄執行

# 2. 啟動（使用 PM2）
pm2 start ecosystem.config.js

# 或單獨啟動
pm2 start apps/api/dist/index.js --name inn-api -- --port 3101
pm2 start apps/web --name inn-web -- start --port 3102
pm2 start apps/admin --name inn-admin -- start --port 3103
pm2 start apps/line-bot/dist/index.js --name inn-linebot -- --port 3104
```

---

## 🔧 維護注意事項

### 與 CampFlow 共用資源

| 資源 | 共用方式 | 注意 |
|------|----------|------|
| Node.js | 統一 v22.x | 避免版本衝突 |
| PostgreSQL | 不同資料庫名稱 | `campflow` vs `campflow_inn_*` |
| Redis | 不同 DB Index | CampFlow: 0, InnSaaS: 1 |
| PM2 | 統一管理 | 使用 ecosystem.config.js |

### 部署協調

1. **更新時機：** 避開 CampFlow 高峯期
2. **資源監控：** 注意記憶體/CPU 使用
3. **日誌管理：** 定期清理避免磁碟滿

---

## 📞 支援

- **專案位置：** `~/projects/inn-saas/`
- **日誌位置：** `~/logs/`
- **PM2 監控：** `pm2 monit`

---

**專案團隊：** OpenClaw  
**最後更新：** 2026-03-09
