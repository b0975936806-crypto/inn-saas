# InnSaaS - SaaS 民宿管理系統

SaaS 多租戶民宿管理系統，支援多個民宿共用同一平台。

## 專案結構

```
inn-saas/
├── apps/
│   ├── api/          # 核心 API 服務（多租戶中介層）
│   ├── web/          # 前台訂房網站
│   ├── admin/        # 後台管理系統
│   └── line-bot/     # LINE Bot Webhook
├── packages/
│   ├── database/     # Prisma schema + 連線管理
│   ├── shared/       # 共用工具函數
│   └── ui/           # 共用 UI 組件
├── nginx/            # Nginx 配置
├── init-scripts/     # 資料庫初始化腳本
├── scripts/          # 部署腳本
└── docker-compose.yml
```

## 部署架構（PM2 + Nginx）

**與 CampFlow 共用單一主機**：

```
┌─ Nginx (反向代理)
│  ├─ camp.yu.dopay.biz → CampFlow Web
│  ├─ inn.yu.dopay.biz → InnSaaS Web
│  ├─ admin.inn.yu.dopay.biz → InnSaaS Admin
│  ├─ api.inn.yu.dopay.biz → InnSaaS API
│  └─ bot.inn.yu.dopay.biz → InnSaaS LINE Bot
│
├─ PM2 (Node 22)
│  ├─ campflow-api (3001) + campflow-web (3002)
│  ├─ inn-api (3101) + inn-web (3102) + inn-admin (3103) + inn-linebot (3104)
│
├─ PostgreSQL (系統安裝)
│  ├─ campflow
│  ├─ campflow_inn_master
│  └─ campflow_inn_tenant_*
│
└─ Redis (系統安裝)
   ├─ DB 0 (CampFlow)
   └─ DB 1 (InnSaaS)
```

### 端口分配

| 應用 | 端口 | 域名 |
|------|------|------|
| campflow-api | 3001 | - |
| campflow-web | 3002 | camp.yu.dopay.biz |
| inn-api | 3101 | api.inn.yu.dopay.biz |
| inn-web | 3102 | inn.yu.dopay.biz |
| inn-admin | 3103 | admin.inn.yu.dopay.biz |
| inn-linebot | 3104 | bot.inn.yu.dopay.biz |

### 快速部署

```bash
# 1. 建置
npm run build

# 2. 啟動（PM2）
pm2 start ecosystem.config.js

# 3. 配置 Nginx
sudo cp deploy/nginx/inn-saas.conf /etc/nginx/conf.d/
sudo systemctl reload nginx
```

詳情請參考 [部署規格文件](./docs/DEPLOY-SPEC.md)

## 開發階段

- [x] S1: 基礎建設（Docker、資料庫架構）
- [ ] S2: 核心 API
- [ ] S3: 前台網站
- [ ] S4: 後台管理
- [ ] S5: LINE 整合
- [ ] S6: 部署測試

## 文件

詳細規格請參考：
- `docs/saas-architecture.md` - 架構設計
- `docs/database-schema.md` - 資料庫設計
- `docs/api-contract.md` - API 規格
- `docs/line-integration.md` - LINE 整合
- `docs/deployment-guide.md` - 部署指南
