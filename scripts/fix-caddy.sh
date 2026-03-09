#!/bin/bash

# 修復 Caddy 權限並重啟

echo "🔧 修復 Caddy 日誌權限..."

# 確保日誌檔案存在並有正確權限
sudo touch /var/log/caddy/inn-saas.log
sudo touch /var/log/caddy/inn-saas-admin.log
sudo touch /var/log/caddy/inn-saas-api.log
sudo touch /var/log/caddy/inn-saas-bot.log
sudo touch /var/log/caddy/inn-saas-demo.log
sudo touch /var/log/caddy/inn-saas-demo-admin.log

sudo chown caddy:caddy /var/log/caddy/*.log
sudo chmod 644 /var/log/caddy/*.log

echo "✅ 權限修復完成"

echo "🔄 嘗試重啟 Caddy..."
sudo systemctl restart caddy

if [ $? -eq 0 ]; then
    echo "✅ Caddy 重啟成功！"
    sudo systemctl status caddy --no-pager
else
    echo "❌ Caddy 重啟失敗，查看錯誤："
    sudo journalctl -xeu caddy.service -n 20 --no-pager
fi
