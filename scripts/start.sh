#!/bin/bash

# SaaS 民宿管理系統 - 啟動腳本

set -e

echo "🚀 InnSaaS 啟動腳本"
echo "===================="

# 檢查 Docker 是否運行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未運行，請先啟動 Docker"
    exit 1
fi

# 建立必要的目錄
mkdir -p logs/api
mkdir -p data/tenants

# 啟動服務
echo "📦 啟動 Docker 服務..."
docker-compose up -d

# 等待資料庫就緒
echo "⏳ 等待資料庫就緒..."
sleep 5

# 檢查服務狀態
echo "🔍 檢查服務狀態..."
docker-compose ps

echo ""
echo "✅ InnSaaS 啟動完成！"
echo ""
echo "🌐 訪問地址："
echo "   主系統: http://inn.yu.dopay.biz"
echo "   測試租戶: http://demo.inn.yu.dopay.biz"
echo "   後台: http://admin.demo.inn.yu.dopay.biz"
echo ""
echo "📝 常用指令："
echo "   查看日誌: docker-compose logs -f"
echo "   停止服務: docker-compose down"
echo "   重新啟動: docker-compose restart"
