# InnSaaS 多租戶系統部署文檔

## 系統架構

### 域名規劃

| 服務 | 域名 | 端口 |
|------|------|------|
| 前台 | inn.yu.dopay.biz | 3102 |
| 系統後台 | admin.inn.yu.dopay.biz | 3103 |
| API | api.inn.yu.dopay.biz | 3101 |
| LINE Bot | bot.inn.yu.dopay.biz | 3104 |

### 租戶子域名規則

| 租戶類型 | 前台域名 | 後台域名 |
|---------|---------|---------|
| Demo | demo.inn.yu.dopay.biz | admin.demo.inn.yu.dopay.biz |
| {slug} | {slug}.inn.yu.dopay.biz | admin.{slug}.inn.yu.dopay.biz |

## Caddy 配置

### /etc/caddy/Caddyfile

```caddy
# 系統前台
inn.yu.dopay.biz {
    encode gzip
    reverse_proxy localhost:3102
    log {
        output file /var/log/caddy/inn-saas.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}

# 系統後台
admin.inn.yu.dopay.biz {
    encode gzip
    reverse_proxy localhost:3103
    log {
        output file /var/log/caddy/inn-saas-admin.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}

# API
api.inn.yu.dopay.biz {
    encode gzip
    reverse_proxy localhost:3101
    log {
        output file /var/log/caddy/inn-saas-api.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}

# LINE Bot
bot.inn.yu.dopay.biz {
    encode gzip
    reverse_proxy localhost:3104
    log {
        output file /var/log/caddy/inn-saas-bot.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}

# Demo 租戶前台
demo.inn.yu.dopay.biz {
    encode gzip
    reverse_proxy localhost:3102
    log {
        output file /var/log/caddy/inn-saas-demo.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}

# Demo 租戶後台
admin.demo.inn.yu.dopay.biz {
    encode gzip
    
    # API 請求轉發到後端
    handle /api/* {
        reverse_proxy localhost:3101
    }
    
    # 其他請求轉發到前端
    handle {
        reverse_proxy localhost:3103
    }
    
    log {
        output file /var/log/caddy/inn-saas-demo-admin.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}
```

### Caddy 重啟命令

```bash
# 驗證配置
sudo caddy validate --config /etc/caddy/Caddyfile

# 重載配置
sudo systemctl reload caddy

# 查看狀態
sudo systemctl status caddy
```

## PM2 服務配置

### ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'inn-api',
      cwd: '/home/yu/projects/inn-saas/apps/api',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3101,
        DATABASE_URL: 'postgresql://postgres:InnSaas_2026_NewPass@localhost:5433/inn_master',
        JWT_SECRET: 'your-jwt-secret-key',
      },
      log_file: '/home/yu/logs/inn-api.log',
      error_file: '/home/yu/logs/inn-api-error.log',
      out_file: '/home/yu/logs/inn-api-out.log',
    },
    {
      name: 'inn-web',
      cwd: '/home/yu/projects/inn-saas/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3102',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3102,
      },
      log_file: '/home/yu/logs/inn-web.log',
    },
    {
      name: 'inn-admin',
      cwd: '/home/yu/projects/inn-saas/apps/admin',
      script: 'node_modules/.bin/next',
      args: 'start --port 3103',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3103,
      },
      log_file: '/home/yu/logs/inn-admin.log',
    },
    {
      name: 'inn-linebot',
      cwd: '/home/yu/projects/inn-saas/apps/linebot',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3104,
      },
      log_file: '/home/yu/logs/inn-linebot.log',
    },
  ],
};
```

### PM2 命令

```bash
# 啟動所有服務
pm2 start ecosystem.config.js

# 重啟單個服務
pm2 restart inn-api
pm2 restart inn-web
pm2 restart inn-admin
pm2 restart inn-linebot

# 查看日誌
pm2 logs inn-api
pm2 logs inn-admin

# 查看狀態
pm2 status
```

## 租戶創建流程

### 方法 1：使用 Node.js 腳本（推薦）

```bash
cd /home/yu/projects/inn-saas/apps/api

node ../../scripts/create-tenant-final.js {slug} "{名稱}" "{郵箱}"

# 範例
node ../../scripts/create-tenant-final.js happystay "快樂居民宿" "happy@inn.tw"
```

腳本會自動完成：
1. 在 inn_master.tenants 建立記錄
2. 創建資料庫 inn_tenant_{slug}
3. 匯入 Schema
4. 啟用 pgcrypto
5. 建立管理員（使用 bcrypt 密碼）
6. 輸出 Caddy 配置

### 方法 2：手動創建

```bash
# 1. 在 inn_master 建立租戶記錄
sudo -i -u postgres psql -d inn_master -p 5433 -c "
INSERT INTO tenants (slug, name, email)
VALUES ('{slug}', '{名稱}', '{郵箱}');
"

# 2. 創建資料庫
sudo -i -u postgres psql -p 5433 -c "CREATE DATABASE inn_tenant_{slug};"

# 3. 匯入 Schema
sudo -i -u postgres psql -d inn_tenant_{slug} -p 5433 \
    < /home/yu/projects/inn-saas/init-scripts/02-tenant-schema.sql

# 4. 啟用 pgcrypto
sudo -i -u postgres psql -d inn_tenant_{slug} -p 5433 \
    -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# 5. 生成 bcrypt 密碼
cd /home/yu/projects/inn-saas/apps/api
HASH=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password123', 10))")

# 6. 建立管理員
sudo -i -u postgres psql -d inn_tenant_{slug} -p 5433 -c "
INSERT INTO users (email, name, password_hash, role, is_active)
VALUES ('admin@{slug}.inn.tw', '{名稱} 管理員', '$HASH', 'owner', true);
"
```

### 創建後手動步驟

```bash
# 1. 添加 Caddy 配置
sudo tee -a /etc/caddy/Caddyfile << EOF

# {名稱} 前台
{slug}.inn.yu.dopay.biz {
    encode gzip
    reverse_proxy localhost:3102
    log {
        output file /var/log/caddy/inn-saas-{slug}.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}

# {名稱} 後台
admin.{slug}.inn.yu.dopay.biz {
    encode gzip
    handle /api/* {
        reverse_proxy localhost:3101
    }
    handle {
        reverse_proxy localhost:3103
    }
    log {
        output file /var/log/caddy/inn-saas-{slug}-admin.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}
EOF

# 2. 驗證並重載 Caddy
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy

# 3. DNS 設定
# 確保 {slug}.inn.yu.dopay.biz 和 admin.{slug}.inn.yu.dopay.biz
# 的 A 記錄指向 211.72.119.153
```

## 登入帳號

### 系統管理員

| 項目 | 值 |
|------|-----|
| 後台網址 | https://admin.inn.yu.dopay.biz |
| 帳號 | admin@innsaas.tw |
| 密碼 | yu66yu66 |

### Demo 租戶管理員

| 項目 | 值 |
|------|-----|
| 後台網址 | https://admin.demo.inn.yu.dopay.biz |
| 帳號 | admin@demo.inn.tw |
| 密碼 | demo123456 |

## 已知問題與解決方案

### 1. Prisma 欄位映射問題

**問題：** Prisma schema 使用駝峰命名（如 `passwordHash`），但 SQL 建立的資料庫使用下劃線（如 `password_hash`）。

**解決方案：**
- 登入路由改用 pg 直接查詢，繞過 Prisma 映射
- 或修改 Prisma schema 添加 `@map` 裝飾器

### 2. 租戶識別問題

**問題：** `/api/admin/auth/login` 需要同時支持系統管理員和租戶管理員登入。

**解決方案：**
```typescript
// 根據 Host 判斷登入類型
const isSystemAdmin = host === 'admin.inn.yu.dopay.biz';

if (isSystemAdmin) {
    // 查詢 system_users
} else {
    // 提取子域名，查詢對應租戶
}
```

### 3. Caddy 配置重複

**問題：** 同一個域名在 Caddyfile 中定義多次會導致錯誤。

**解決方案：**
```bash
# 編輯前檢查是否有重複
grep "demo.inn" /etc/caddy/Caddyfile

# 確保每個域名只出現一次
```

## 維護命令

```bash
# 查看所有日誌
tail -f /home/yu/logs/inn-api.log
tail -f /home/yu/logs/inn-admin.log

# 查看 Caddy 日誌
tail -f /var/log/caddy/inn-saas-*.log

# 資料庫備份
sudo -i -u postgres pg_dump -p 5433 inn_master > backup_master.sql
sudo -i -u postgres pg_dump -p 5433 inn_tenant_demo > backup_demo.sql

# 查看租戶列表
sudo -i -u postgres psql -d inn_master -p 5433 -c "SELECT id, slug, name, email FROM tenants;"
```

## 目錄結構

```
/home/yu/projects/inn-saas/
├── apps/
│   ├── api/              # API 服務 (port 3101)
│   ├── web/              # 前台 (port 3102)
│   ├── admin/            # 後台 (port 3103)
│   └── linebot/          # LINE Bot (port 3104)
├── init-scripts/
│   ├── 01-master-schema.sql
│   └── 02-tenant-schema.sql
├── scripts/
│   ├── create-tenant-final.js    # 租戶創建腳本
│   └── fix-caddy.sh              # Caddy 修復腳本
└── ecosystem.config.js   # PM2 配置
```

---

**最後更新：** 2026-03-09
**版本：** v1.0
