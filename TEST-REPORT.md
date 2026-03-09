# InnSaaS S6 部署測試報告

**測試日期：** 2026-03-09  
**測試人員：** DevOps 部署員  
**部署環境：** Docker Compose (本地測試)

---

## 測試摘要

| 項目 | 狀態 | 備註 |
|------|------|------|
| 整體部署 | ✅ 成功 | 所有服務正常運行 |
| Docker 映像建置 | ✅ 成功 | 5 個服務映像檔已建立 |
| 資料庫初始化 | ✅ 成功 | Master + Demo 租戶資料庫 |
| Nginx 反向代理 | ✅ 成功 | 路由配置正常 |
| API 服務 | ✅ 成功 | 租戶路由、健康檢查正常 |
| Web 前台 | ✅ 成功 | 頁面載入正常 |
| Admin 後台 | ✅ 成功 | 服務運行中 |
| LINE Bot | ✅ 成功 | Webhook 接收正常 |
| Redis 快取 | ✅ 成功 | 連線正常 |
| SSL 設定 | ⚠️ 待完成 | 需正式域名與憑證 |

---

## 詳細測試結果

### 1. 服務狀態

```
服務名稱              狀態           健康檢查
─────────────────────────────────────────────
inn-saas_api_1        Up (healthy)   ✅
inn-saas_admin_1      Up (healthy)   ✅
inn-saas_web_1        Up (healthy)   ✅
inn-saas_line-bot_1   Up (healthy)   ✅
inn-saas_nginx_1      Up             ⚠️ (健康檢查路徑待調整)
inn-saas_postgres_1   Up (healthy)   ✅
inn-saas_redis_1      Up (healthy)   ✅
```

### 2. 端點測試

| 端點 | 方法 | 預期結果 | 實際結果 | 狀態 |
|------|------|----------|----------|------|
| `/health` | GET | Nginx OK | InnSaaS Nginx OK | ✅ |
| `/api/room-types` | GET | 回傳房間類型 | `{success:true,data:[]}` | ✅ |
| `/` | GET | Web 前台 | HTTP 200, 5829 bytes | ✅ |
| `/webhook` | POST | LINE Bot 處理 | Missing signature (預期) | ✅ |

### 3. 資料庫測試

```sql
-- 資料庫列表
inn_master      ✅ 已創建
inn_tenant_demo ✅ 已創建

-- Demo 租戶資料表
RoomType    ✅
Room        ✅
Booking     ✅
User        ✅
Tenant      ✅
LineBotSettings ✅
```

### 4. 租戶路由測試

- **X-Tenant-ID Header:** ✅ 正常運作
- **Demo 租戶連線:** ✅ 成功連線 inn_tenant_demo
- **API 權限控制:** ✅ 未認證請求被正確拒絕

---

## 已知問題與限制

### 已解決
1. ✅ Prisma libssl 相容性問題 - 在 Dockerfile 安裝 openssl
2. ✅ 租戶資料庫連線問題 - 執行 `prisma db push` 同步 schema
3. ✅ Nginx 端口占用 - 改用 8080/8443 端口

### 待處理
1. ⚠️ Nginx 容器健康檢查狀態顯示 unhealthy (功能正常)
2. ⚠️ SSL 憑證需正式部署時申請 (Let's Encrypt)
3. ⚠️ 正式域名 DNS 需設定
4. ⚠️ 生產環境需設定防火牆規則

---

## 部署指令速查

```bash
# 啟動所有服務
docker-compose up -d

# 查看日誌
docker-compose logs -f [service-name]

# 重新建置
docker-compose build --no-cache [service-name]

# 資料庫遷移
docker-compose exec api npx prisma migrate deploy

# 建立租戶資料庫
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE inn_tenant_[slug];"

# 備份
docker-compose exec postgres pg_dump -U postgres inn_master > backup.sql
```

---

## 訪問網址

| 服務 | 本地測試網址 |
|------|-------------|
| Web 前台 | http://localhost:8080/ |
| API | http://localhost:8080/api/ |
| LINE Bot | http://localhost:8080/webhook |
| 後台管理 | http://localhost:8080/ (透過 admin.localhost) |

**正式環境域名:**
- https://inn.yu.dopay.biz (主站)
- https://demo.inn.yu.dopay.biz (前台)
- https://admin.demo.inn.yu.dopay.biz (後台)
- https://bot.inn.yu.dopay.biz (LINE Bot)

---

## 結論

✅ **部署測試成功**

所有核心功能已正常運作：
- Docker Compose 配置正確
- Nginx 反向代理運作正常
- API 服務支援多租戶
- 前台/後台網站可正常訪問
- LINE Bot Webhook 可接收請求
- 資料庫與快取服務運作正常

**建議下一步：**
1. 申請 SSL 憑證 (Let's Encrypt)
2. 設定正式域名 DNS
3. 部署至正式伺服器
4. 設定監控與告警

---

**報告產生時間：** 2026-03-09 01:35 GMT+8  
**測試執行者：** DevOps 部署員 Agent
