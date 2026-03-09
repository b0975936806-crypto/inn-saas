#!/bin/bash

# InnSaaS LINE Bot 整合測試
# 測試完整的預訂流程

API_URL="http://localhost:3000"
BOT_URL="http://localhost:3001"

echo "🧪 InnSaaS LINE Bot 整合測試"
echo "============================"

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 測試計數器
PASSED=0
FAILED=0

# 測試函數
test_api_health() {
    echo -n "📡 測試 API 健康檢查... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health")
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ 通過${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失敗 (HTTP $response)${NC}"
        ((FAILED++))
    fi
}

test_bot_health() {
    echo -n "🤖 測試 LINE Bot 健康檢查... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "${BOT_URL}/health")
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ 通過${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失敗 (HTTP $response)${NC}"
        ((FAILED++))
    fi
}

test_bot_webhook() {
    echo -n "📩 測試 LINE Bot Webhook... "
    response=$(curl -s -X POST "${BOT_URL}/webhook" \
        -H "Content-Type: application/json" \
        -d '{
            "events": [{
                "type": "message",
                "replyToken": "test-token",
                "source": {"type": "user", "userId": "test-user"},
                "message": {"type": "text", "text": "查空房"}
            }]
        }' -o /dev/null -w "%{http_code}")
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ 通過${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失敗 (HTTP $response)${NC}"
        ((FAILED++))
    fi
}

test_api_availability() {
    echo -n "🏨 測試 API 空房查詢... "
    response=$(curl -s "${API_URL}/api/public/availability?checkIn=2025-03-15&checkOut=2025-03-17" \
        -H "X-Tenant-ID: demo" \
        -o /dev/null -w "%{http_code}")
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ 通過${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失敗 (HTTP $response)${NC}"
        ((FAILED++))
    fi
}

test_api_room_types() {
    echo -n "🛏️  測試 API 房型列表... "
    response=$(curl -s "${API_URL}/api/room-types" \
        -H "X-Tenant-ID: demo" \
        -o /dev/null -w "%{http_code}")
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ 通過${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失敗 (HTTP $response)${NC}"
        ((FAILED++))
    fi
}

# 執行測試
echo ""
test_api_health
test_bot_health
test_bot_webhook
test_api_availability
test_api_room_types

# 測試結果
echo ""
echo "============================"
echo "📊 測試結果"
echo "============================"
echo -e "${GREEN}通過: $PASSED${NC}"
echo -e "${RED}失敗: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有測試通過！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  部分測試失敗，請檢查服務狀態${NC}"
    exit 1
fi
