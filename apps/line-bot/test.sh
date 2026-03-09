#!/bin/bash

# InnSaaS LINE Bot 測試腳本

echo "🧪 測試 InnSaaS LINE Bot"
echo "========================"

# 測試建置
echo ""
echo "📦 1. 測試 TypeScript 編譯..."
cd ~/projects/inn-saas/apps/line-bot
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 編譯成功"
else
    echo "❌ 編譯失敗"
    exit 1
fi

# 檢查環境變數
echo ""
echo "🔧 2. 檢查環境變數..."
if [ -f .env ]; then
    echo "✅ .env 檔案存在"
else
    echo "⚠️  .env 檔案不存在，複製範例檔案"
    cp .env.example .env
    echo "請編輯 .env 檔案設定您的 LINE Bot 憑證"
fi

# 檢查檔案結構
echo ""
echo "📁 3. 檔案結構檢查..."

files=(
    "src/index.ts"
    "src/config/index.ts"
    "src/types/index.ts"
    "src/services/redis.service.ts"
    "src/services/line.service.ts"
    "src/services/api.service.ts"
    "src/middleware/signature.ts"
    "src/handlers/webhook.handler.ts"
    "src/handlers/message.handler.ts"
    "src/handlers/postback.handler.ts"
    "src/handlers/commands.handler.ts"
    "src/handlers/follow.handler.ts"
    "src/flex-messages/index.ts"
)

all_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file"
        all_exist=false
    fi
done

if [ "$all_exist" = true ]; then
    echo "✅ 所有檔案都存在"
else
    echo "❌ 部分檔案缺失"
    exit 1
fi

echo ""
echo "🚀 4. 啟動測試..."
echo "   請執行: npm run dev"
echo ""
echo "📋 測試 URL:"
echo "   健康檢查: http://localhost:3001/health"
echo "   Webhook:  http://localhost:3001/webhook"
echo ""
echo "✅ 測試完成！"
