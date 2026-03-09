# 📝 架構變更記錄

**日期：** 2026-03-09  
**變更類型：** 資料庫架構調整  
**影響範圍：** InnSaaS 專案

---

## 🔄 變更摘要

### 變更前
- **PostgreSQL：** Docker 容器 (`inn-saas_postgres_1`)
- **Port：** 5432
- **連線方式：** Docker 內部網路

### 變更後
- **PostgreSQL：** 系統安裝的 PostgreSQL
- **Port：** 5433
- **連線方式：** localhost:5433

---

## 📊 架構對比

| 項目 | 變更前 | 變更後 |
|------|--------|--------|
| PostgreSQL 類型 | Docker 容器 | 系統安裝 |
| Port | 5432 | 5433 |
| 連線字串 | `postgresql://postgres:pass@postgres:5432/inn_master` | `postgresql://postgres:pass@localhost:5433/inn_master` |
| 啟動方式 | `docker compose up` | `sudo systemctl start postgresql` |
| 備份方式 | `docker exec ... pg_dump` | `pg_dump -h localhost -p 5433 ...` |
| 監控 | `docker logs` | `sudo systemctl status postgresql` |

---

## ✅ 已完成的更新

### 1. 系統設定
- [x] 設定系統 PostgreSQL 密碼：`InnSaas_2026_NewPass`
- [x] 建立資料庫：`inn_master`、`inn_tenant_demo`
- [x] 停止並移除 Docker PostgreSQL 容器

### 2. 設定檔更新
- [x] `~/projects/inn-saas/.env` - 更新 DATABASE_URL（port 5433）
- [x] `~/projects/inn-saas/DEPLOY.md` - 更新部署說明
- [x] `~/projects/inn-saas/docs/DEPLOY-SPEC.md` - 更新規格文件
- [x] `~/openclaw/workspace-main/PASSWORDS.md` - 記錄密碼

---

## 🚀 新的部署流程

### 前置需求
```bash
# 確保系統 PostgreSQL 運行
sudo systemctl status postgresql

# 測試連線
PGPASSWORD=InnSaas_2026_NewPass psql -h localhost -p 5433 -U postgres -c "SELECT version();"
```

### 環境變數
```bash
# .env
DB_PASSWORD=InnSaas_2026_NewPass
DATABASE_URL=postgresql://postgres:InnSaas_2026_NewPass@localhost:5433/inn_master
```

### 資料庫操作
```bash
# 備份
PGPASSWORD=InnSaas_2026_NewPass pg_dump -h localhost -p 5433 -U postgres inn_master > backup.sql

# 還原
PGPASSWORD=InnSaas_2026_NewPass psql -h localhost -p 5433 -U postgres inn_master < backup.sql

# 進入資料庫
PGPASSWORD=InnSaas_2026_NewPass psql -h localhost -p 5433 -U postgres -d inn_master
```

---

## 📋 注意事項

1. **CampFlow 不受影響** - 繼續使用 Docker PostgreSQL (port 5434)
2. **Port 5433** - 確保防火牆允許本地連線
3. **密碼管理** - 密碼儲存在 `~/.openclaw/workspace-main/PASSWORDS.md`

---

## 🔍 驗證指令

```bash
# 驗證系統 PostgreSQL
sudo systemctl is-active postgresql

# 驗證資料庫存在
PGPASSWORD=InnSaas_2026_NewPass psql -h localhost -p 5433 -U postgres -c "\l" | grep inn_

# 驗證 Docker PostgreSQL 已停止
docker ps | grep inn-saas_postgres  # 應該沒有輸出
```

---

## 📞 相關人員

- **執行人：** 秘書（諸葛）
- **通知：** 經理、後端顧問
- **密碼管理：** 記錄於 `PASSWORDS.md`

---

**變更完成時間：** 2026-03-09 02:50 (Asia/Taipei)
