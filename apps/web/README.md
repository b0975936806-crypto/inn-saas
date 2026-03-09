# InnSaaS 前台網站

Next.js 14 開發的民宿訂房前台系統。

## 技術棧

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **狀態管理**: Zustand
- **表單**: React Hook Form + Zod
- **HTTP 客戶端**: Axios

## 功能特性

- ✅ 多租戶支援（子域名識別）
- ✅ 民宿資訊展示
- ✅ 房型列表與篩選
- ✅ 日期選擇器
- ✅ 空房查詢
- ✅ 預訂流程
- ✅ 金流整合（綠界/LinePay）
- ✅ 響應式設計

## 頁面結構

```
/
├── /                  # 首頁 - 民宿展示、搜尋框
├── /rooms             # 房型列表 - 空房查詢結果
├── /rooms/[id]        # 房型詳情 - 房間資訊、預訂
├── /booking           # 預訂流程 - 填寫資料、付款
└── /booking/confirm   # 預訂確認 - 付款結果
```

## 環境變數

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_DEV_SUBDOMAIN=demo  # 本地開發使用的子域名
```

## 開發指令

```bash
# 安裝依賴
cd ~/projects/inn-saas
pnpm install

# 開發模式
cd apps/web
npm run dev

# 生產構建
npm run build
```

## API 整合

前台網站需要連接以下 API：

| 端點 | 說明 |
|------|------|
| GET /api/tenants/current | 取得當前租戶資訊 |
| GET /api/tenants/subdomain/:subdomain | 依子域名取得租戶 |
| GET /api/room-types | 取得房型列表 |
| GET /api/room-types/:id | 取得房型詳情 |
| GET /api/rooms/availability | 查詢空房 |
| POST /api/bookings | 建立預訂 |
| POST /api/payments | 建立付款 |

## 開發規範

1. **禁止硬編碼** - 所有資料從 API 動態取得
2. **禁止靜態資料** - 所有資料來自資料庫
3. **型別安全** - 全部使用 TypeScript 型別
4. **響應式設計** - 支援桌面/手機

## 注意事項

- 本地開發時可設置 `NEXT_PUBLIC_DEV_SUBDOMAIN` 模擬子域名
- 金流整合使用測試模式，不會進行實際扣款
- 預訂資料會存儲在 localStorage 中
