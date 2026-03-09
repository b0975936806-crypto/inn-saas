# InnSaaS 部署規格文件

**版本：** 1.0  
**日期：** 2026-03-09  
**架構：** 單一主機 + PM2 管理 + Nginx 反向代理

---

## 📐 系統架構

```
┌─────────────────────────────────────────────┐
│              Nginx (反向代理)                │
│  ├─ camp.yu.dopay.biz → localhost:3002     │
│  ├─ inn.yu.dopay.biz → localhost:3102      │
│  ├─ admin.inn.yu.dopay.biz → localhost:3103│
│  ├─ api.inn.yu.dopay.biz → localhost:3101  │
│  └─ bot.inn.yu.dopay.biz → localhost:3104  │
└─────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────┐
│           PM2 應用管理 (Node 22)            │
│  ┌─ campflow-api    (port 3001)            │
│  ├─ campflow-web    (port 3002)            │
│  ├─ inn-api         (port 3101)            │
│  ├─ inn-web         (port 3102)            │
│  ├─ inn-admin       (port 3103)            │
│  └─ inn-linebot     (port 3104)            │
└─────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────┐
│         PostgreSQL (系統安裝)               │
│  ├─ campflow                               │
│  ├─ inn_master                             │
│  └─ inn_tenant_*                           │
└─────────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────┐
│          Redis (系統安裝)                   │
│  ├─ DB 0 (CampFlow)                        │
│  └─ DB 1 (InnSaaS)                         │
└─────────────────────────────────────────────┘
```

---

## 🔢 端口分配表

| 應用 | 端口 | 域名 | 說明 |
|------|------|------|------|
| campflow-api | 3001 | - | CampFlow API |
| campflow-web | 3002 | camp.yu.dopay.biz | CampFlow 前台 |
| inn-api | 3101 | api.inn.yu.dopay.biz | InnSaaS API |
| inn-web | 3102 | inn.yu.dopay.biz | InnSaaS 前台 |
| inn-admin | 3103 | admin.inn.yu.dopay.biz | InnSaaS 後台 |
| inn-linebot | 3104 | bot.inn.yu.dopay.biz | InnSaaS LINE Bot |
| PostgreSQL | 5433 | - | 系統安裝的 PostgreSQL |
| Redis | 6379 | - | 系統安裝的 Redis |

---

## 🗄️ 資料庫規劃

### PostgreSQL 資料庫

```sql
-- CampFlow 專用
campflow

-- InnSaaS Master
inn_master

-- InnSaaS 租戶（動態建立）
inn_tenant_{slug}
```

### Redis 資料隔離

| 應用 | DB Index | 用途 |
|------|----------|------|
| CampFlow | 0 | Session / Cache |
| InnSaaS | 1 | Session / Cache / LINE Bot |

---

## ⚙️ PM2 配置

### ecosystem.config.js

```javascript
module.exports = {
  apps: [
    // CampFlow
    {
      name: 'campflow-api',
      cwd: '/home/yu/projects/campflow/apps/api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      log_file: '/home/yu/logs/campflow-api.log',
      out_file: '/home/yu/logs/campflow-api-out.log',
      error_file: '/home/yu/logs/campflow-api-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'campflow-web',
      cwd: '/home/yu/projects/campflow/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3002',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
      },
      log_file: '/home/yu/logs/campflow-web.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    // InnSaaS
    {
      name: 'inn-api',
      cwd: '/home/yu/projects/inn-saas/apps/api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        PORT: 3101,
        DATABASE_URL: 'postgresql://postgres:password@localhost:5433/inn_master',
        REDIS_URL: 'redis://localhost:6379/1',
      },
      log_file: '/home/yu/logs/inn-api.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'inn-web',
      cwd: '/home/yu/projects/inn-saas/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3102',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.inn.yu.dopay.biz',
      },
      log_file: '/home/yu/logs/inn-web.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'inn-admin',
      cwd: '/home/yu/projects/inn-saas/apps/admin',
      script: 'node_modules/.bin/next',
      args: 'start --port 3103',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.inn.yu.dopay.biz',
      },
      log_file: '/home/yu/logs/inn-admin.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'inn-linebot',
      cwd: '/home/yu/projects/inn-saas/apps/line-bot',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        PORT: 3104,
        REDIS_URL: 'redis://localhost:6379/1',
      },
      log_file: '/home/yu/logs/inn-linebot.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

---

## 🔧 Nginx 配置

### /etc/nginx/conf.d/campflow.conf

```nginx
server {
    listen 80;
    server_name camp.yu.dopay.biz;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### /etc/nginx/conf.d/inn-saas.conf

```nginx
# InnSaaS Web
server {
    listen 80;
    server_name inn.yu.dopay.biz;
    
    location / {
        proxy_pass http://localhost:3102;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# InnSaaS Admin
server {
    listen 80;
    server_name admin.inn.yu.dopay.biz;
    
    location / {
        proxy_pass http://localhost:3103;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# InnSaaS API
server {
    listen 80;
    server_name api.inn.yu.dopay.biz;
    
    location / {
        proxy_pass http://localhost:3101;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# InnSaaS LINE Bot
server {
    listen 80;
    server_name bot.inn.yu.dopay.biz;
    
    location / {
        proxy_pass http://localhost:3104;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🚀 部署步驟

### 1. 前置準備

```bash
# 確保 Node 22
node --version  # 應顯示 v22.x.x

# 確保 PostgreSQL 和 Redis 運行
sudo systemctl status postgresql
sudo systemctl status redis

# 建立日誌目錄
mkdir -p ~/logs
```

### 2. 建立資料庫

```bash
# 連線 PostgreSQL（系統安裝，port 5433）
PGPASSWORD=your_password psql -h localhost -p 5433 -U postgres

# 建立資料庫
CREATE DATABASE inn_master;
CREATE DATABASE inn_tenant_demo;

# 建立 InnSaaS 用戶（可選）
CREATE USER innsaas WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE inn_master TO innsaas;
GRANT ALL PRIVILEGES ON DATABASE inn_tenant_demo TO innsaas;

\q
```

### 3. 安裝 PM2

```bash
npm install -g pm2
```

### 4. 配置環境變數

```bash
# InnSaaS API
cd ~/projects/inn-saas/apps/api
cp .env.example .env
# 編輯 .env，設定 DATABASE_URL 和 REDIS_URL

# InnSaaS Web/Admin
cd ~/projects/inn-saas/apps/web
cp .env.example .env.local
cd ~/projects/inn-saas/apps/admin
cp .env.example .env.local

# LINE Bot
cd ~/projects/inn-saas/apps/line-bot
cp .env.example .env
```

### 5. 建置專案

```bash
# InnSaaS API
cd ~/projects/inn-saas/apps/api
npm install
npm run build

# InnSaaS Web
cd ~/projects/inn-saas/apps/web
npm install
npm run build

# InnSaaS Admin
cd ~/projects/inn-saas/apps/admin
npm install
npm run build

# LINE Bot
cd ~/projects/inn-saas/apps/line-bot
npm install
npm run build
```

### 6. 啟動服務

```bash
# 使用 PM2 啟動所有服務
cd ~/projects/inn-saas
pm2 start ecosystem.config.js

# 儲存 PM2 配置
pm2 save
pm2 startup
```

### 7. 配置 Nginx

```bash
# 複製配置（需要 sudo）
sudo cp ~/projects/inn-saas/deploy/nginx/inn-saas.conf /etc/nginx/conf.d/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔍 維護指南

### 查看服務狀態

```bash
# 查看所有服務
pm2 status

# 查看日誌
pm2 logs
pm2 logs inn-api
pm2 logs inn-web

# 監控
pm2 monit
```

### 更新部署

```bash
# 1. 更新程式碼
cd ~/projects/inn-saas
git pull

# 2. 重新建置
cd apps/api && npm run build
cd apps/web && npm run build
cd apps/admin && npm run build
cd apps/line-bot && npm run build

# 3. 無縫重啟
pm2 reload all

# 或單獨重啟
pm2 reload inn-api
pm2 reload inn-web
```

### 備份

```bash
# 資料庫備份
pg_dump campflow_inn_master > backup_inn_master_$(date +%Y%m%d).sql

# Redis 備份
redis-cli BGSAVE
```

### 日誌清理

```bash
# PM2 日誌清理
pm2 flush

# 或手動清理
cd ~/logs
find . -name "*.log" -mtime +30 -delete
```

---

## 📋 故障排除

### 服務無法啟動

1. 檢查端口是否被占用：`lsof -i :3101`
2. 檢查環境變數是否正確：`cat .env`
3. 查看日誌：`pm2 logs inn-api`

### 資料庫連線失敗

1. 檢查 PostgreSQL 運行狀態：`sudo systemctl status postgresql`
2. 檢查連線字串：`.env` 中的 `DATABASE_URL`
3. 測試連線：`psql $DATABASE_URL`

### Nginx 502 錯誤

1. 檢查 PM2 服務：`pm2 status`
2. 檢查端口監聽：`netstat -tlnp | grep 310`
3. 檢查 Nginx 配置：`sudo nginx -t`

---

## 📚 相關文件

- [InnSaaS README](./README.md)
- [InnSaaS DEPLOY.md](./DEPLOY.md)
- [CampFlow 部署文件](../campflow/DEPLOY.md)
- [PM2 官方文件](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

**維護人員：** OpenClaw 團隊  
**最後更新：** 2026-03-09 - 資料庫改為系統 PostgreSQL (port 5433)
