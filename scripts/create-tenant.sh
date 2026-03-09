#!/bin/bash

# InnSaaS 租戶自動化創建腳本
# 使用方式: ./create-tenant.sh <slug> <名稱> <聯絡郵箱>

set -e

# 檢查參數
if [ $# -lt 3 ]; then
    echo "使用方式: $0 <slug> <民宿名稱> <聯絡郵箱>"
    echo "範例: $0 happystay '快樂居民宿' 'happy@inn.tw'"
    exit 1
fi

SLUG=$1
NAME=$2
EMAIL=$3
PHONE="${4:-02-12345678}"
DB_NAME="inn_tenant_${SLUG}"
ADMIN_EMAIL="admin@${SLUG}.inn.tw"
ADMIN_PASSWORD="${SLUG}123456"

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 開始創建租戶: ${NAME}${NC}"
echo "=========================================="

# 步驟 1: 檢查必要命令
command -v psql >/dev/null 2>&1 || { echo -e "${RED}❌ 需要安裝 PostgreSQL client${NC}"; exit 1; }

# 步驟 2: 在 inn_master 建立租戶記錄
echo -e "${YELLOW}📋 步驟 1: 在 inn_master 建立租戶記錄${NC}"
sudo -i -u postgres psql -d inn_master -p 5433 << EOF
INSERT INTO tenants (
    slug, name, description, email, phone, address,
    db_name, is_active, is_trial, trial_ends_at
) VALUES (
    '${SLUG}', '${NAME}', '由腳本自動創建',
    '${EMAIL}', '${PHONE}', '待設定',
    '${DB_NAME}', true, true, NOW() + INTERVAL '30 days'
) ON CONFLICT (slug) DO UPDATE SET
    name = '${NAME}',
    email = '${EMAIL}',
    updated_at = NOW();
EOF

echo -e "${GREEN}✅ 租戶記錄已建立${NC}"

# 步驟 3: 建立租戶資料庫
echo -e "${YELLOW}📋 步驟 2: 建立資料庫 ${DB_NAME}${NC}"
sudo -i -u postgres psql -p 5433 << EOF
SELECT 'CREATE DATABASE ${DB_NAME}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}');\gexec
EOF

echo -e "${GREEN}✅ 資料庫已建立${NC}"

# 步驟 4: 匯入 Schema
echo -e "${YELLOW}📋 步驟 3: 匯入 Schema${NC}"
sudo -i -u postgres psql -d ${DB_NAME} -p 5433 -f ~/projects/inn-saas/init-scripts/02-tenant-schema.sql

echo -e "${GREEN}✅ Schema 匯入完成${NC}"

# 步驟 5: 啟用 pgcrypto
echo -e "${YELLOW}📋 步驟 4: 啟用 pgcrypto 擴展${NC}"
sudo -i -u postgres psql -d ${DB_NAME} -p 5433 -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

echo -e "${GREEN}✅ pgcrypto 已啟用${NC}"

# 步驟 6: 建立管理員（使用 pgcrypto）
echo -e "${YELLOW}📋 步驟 5: 建立管理員帳號${NC}"
sudo -i -u postgres psql -d ${DB_NAME} -p 5433 << EOF
INSERT INTO users (
    email, phone, name, password_hash, role, is_active
) VALUES (
    '${ADMIN_EMAIL}',
    '${PHONE}',
    '${NAME} 管理員',
    crypt('${ADMIN_PASSWORD}', gen_salt('bf')),
    'owner',
    true
) ON CONFLICT (email) DO UPDATE SET
    password_hash = crypt('${ADMIN_PASSWORD}', gen_salt('bf')),
    updated_at = NOW();
EOF

echo -e "${GREEN}✅ 管理員已建立${NC}"

# 步驟 7: 輸出 Caddy 配置
echo ""
echo -e "${YELLOW}📋 步驟 6: Caddy 配置（請手動添加到 /etc/caddy/Caddyfile）${NC}"
echo "=========================================="
cat << EOF

# ${NAME} 前台
${SLUG}.inn.yu.dopay.biz {
    encode gzip
    reverse_proxy localhost:3102
    log {
        output file /var/log/caddy/inn-saas-${SLUG}.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}

# ${NAME} 管理後台
admin.${SLUG}.inn.yu.dopay.biz {
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
        output file /var/log/caddy/inn-saas-${SLUG}-admin.log {
            roll_size 10MB
            roll_keep 10
        }
    }
}
EOF

echo "=========================================="

# 步驟 8: DNS 提示
echo ""
echo -e "${YELLOW}📋 步驟 7: DNS 設定${NC}"
echo "請確保以下域名已設定 A 記錄指向 211.72.119.153:"
echo "  - ${SLUG}.inn.yu.dopay.biz"
echo "  - admin.${SLUG}.inn.yu.dopay.biz"

# 步驟 9: 輸出摘要
echo ""
echo -e "${GREEN}🎉 租戶創建完成！${NC}"
echo "=========================================="
echo "租戶名稱: ${NAME}"
echo "Slug: ${SLUG}"
echo "資料庫: ${DB_NAME}"
echo ""
echo "管理員帳號:"
echo "  帳號: ${ADMIN_EMAIL}"
echo "  密碼: ${ADMIN_PASSWORD}"
echo ""
echo "前台網址: https://${SLUG}.inn.yu.dopay.biz"
echo "後台網址: https://admin.${SLUG}.inn.yu.dopay.biz"
echo "=========================================="
echo ""
echo -e "${YELLOW}⚠️  請執行：${NC}"
echo "1. 將上面的 Caddy 配置添加到 /etc/caddy/Caddyfile"
echo "2. 執行: sudo systemctl reload caddy"
echo "3. 確認 DNS 已設定"
echo ""
