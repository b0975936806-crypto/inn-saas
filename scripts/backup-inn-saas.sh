#!/bin/bash

# InnSaaS 專案備份腳本
# 使用方法: ./backup-inn-saas.sh [備份名稱]

set -e

BACKUP_NAME="${1:-inn-saas-$(date +%Y%m%d-%H%M%S)}"
BACKUP_DIR="/home/yu/backups/${BACKUP_NAME}"

echo "🚀 開始備份 InnSaaS 專案"
echo "=========================================="
echo "備份名稱: ${BACKUP_NAME}"
echo "備份位置: ${BACKUP_DIR}"
echo ""

# 創建備份目錄
mkdir -p "${BACKUP_DIR}"

# 步驟 1: 備份代碼
echo "📦 步驟 1: 備份代碼..."
mkdir -p "${BACKUP_DIR}/code"
rsync -av --exclude='node_modules' --exclude='.next' --exclude='dist' \
    /home/yu/projects/inn-saas/ "${BACKUP_DIR}/code/"
echo "✅ 代碼備份完成"
echo ""

# 步驟 2: 備份 inn_master 資料庫
echo "📦 步驟 2: 備份 inn_master 資料庫..."
sudo -i -u postgres pg_dump -p 5433 -Fc inn_master > "${BACKUP_DIR}/inn_master.dump"
echo "✅ inn_master 備份完成"
echo ""

# 步驟 3: 備份所有租戶資料庫
echo "📦 步驟 3: 備份租戶資料庫..."
for db in $(sudo -i -u postgres psql -p 5433 -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'inn_tenant_%'"); do
    db=$(echo $db | xargs)  # 去除空白
    if [ -n "$db" ]; then
        echo "  備份 ${db}..."
        sudo -i -u postgres pg_dump -p 5433 -Fc "$db" > "${BACKUP_DIR}/${db}.dump"
    fi
done
echo "✅ 租戶資料庫備份完成"
echo ""

# 步驟 4: 備份 Caddy 配置
echo "📦 步驟 4: 備份 Caddy 配置..."
sudo cp /etc/caddy/Caddyfile "${BACKUP_DIR}/Caddyfile"
echo "✅ Caddy 配置備份完成"
echo ""

# 步驟 5: 備份 PM2 配置
echo "📦 步驟 5: 備份 PM2 配置..."
cp /home/yu/projects/inn-saas/ecosystem.config.js "${BACKUP_DIR}/ecosystem.config.js"
echo "✅ PM2 配置備份完成"
echo ""

# 步驟 6: 創建備份清單
echo "📦 步驟 6: 創建備份清單..."
cat > "${BACKUP_DIR}/BACKUP_INFO.txt" << EOF
InnSaaS 專案備份
================

備份時間: $(date)
備份名稱: ${BACKUP_NAME}

內容清單:
- code/: 專案代碼（排除 node_modules, .next, dist）
- inn_master.dump: 主資料庫
- inn_tenant_*.dump: 各租戶資料庫
- Caddyfile: Caddy 配置
- ecosystem.config.js: PM2 配置

恢復方法:
1. 代碼: cp -r code/* /home/yu/projects/inn-saas/
2. 資料庫: pg_restore -d 資料庫名 備份檔.dump
3. 配置: 複製 Caddyfile 和 ecosystem.config.js 到對應位置

自動化腳本:
- 創建租戶: code/scripts/create-tenant-final.js
- 修復 Caddy: code/scripts/fix-caddy.sh
- 部署文檔: code/DEPLOY.md
EOF
echo "✅ 備份清單創建完成"
echo ""

# 步驟 7: 打包壓縮
echo "📦 步驟 7: 打包壓縮..."
cd /home/yu/backups
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
echo "✅ 打包完成: ${BACKUP_NAME}.tar.gz"
echo ""

# 輸出摘要
echo "🎉 備份完成！"
echo "=========================================="
echo "備份檔案: /home/yu/backups/${BACKUP_NAME}.tar.gz"
echo "原始目錄: ${BACKUP_DIR}"
echo ""
echo "檔案大小:"
ls -lh "/home/yu/backups/${BACKUP_NAME}.tar.gz"
echo ""
echo "備份內容:"
ls -la "${BACKUP_DIR}"
echo "=========================================="
