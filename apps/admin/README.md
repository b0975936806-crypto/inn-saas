# InnSaaS 後台管理系統

民宿管理系統的後台管理介面，使用 Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui 開發。

## 專案結構

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   ├── dashboard/         # 儀表板頁面
│   │   │   ├── rooms/        # 房間管理
│   │   │   ├── bookings/     # 預訂管理
│   │   │   ├── users/        # 用戶管理
│   │   │   ├── settings/     # 設定頁
│   │   │   ├── layout.tsx    # 儀表板佈局
│   │   │   └── page.tsx      # 儀表板首頁
│   │   ├── login/            # 登入頁
│   │   ├── layout.tsx        # 根佈局
│   │   └── page.tsx          # 首頁（重定向到登入）
│   ├── components/
│   │   ├── ui/               # shadcn/ui 組件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── separator.tsx
│   │   │   └── skeleton.tsx
│   │   └── layout/
│   │       └── sidebar.tsx    # 側邊欄導航
│   ├── hooks/
│   │   └── use-toast.ts       # Toast Hook
│   ├── lib/
│   │   └── utils.ts           # 工具函數
│   └── types/
│       └── index.ts           # TypeScript 類型定義
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── Dockerfile
```

## 開發環境設定

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

開發伺服器將在 http://localhost:3001 啟動

### 建置

```bash
npm run build
```

### 生產環境

```bash
npm start
```

## 頁面說明

| 頁面 | 路徑 | 功能 |
|------|------|------|
| 登入頁 | `/login` | 管理員登入 |
| 儀表板 | `/dashboard` | 數據總覽（今日入住/退房、待處理預訂、營收統計） |
| 房間管理 | `/dashboard/rooms` | 房型/房間 CRUD、狀態管理 |
| 預訂管理 | `/dashboard/bookings` | 預訂列表、詳情查看、狀態更新 |
| 用戶管理 | `/dashboard/users` | 會員管理、權限設定 |
| 設定頁 | `/dashboard/settings` | 民宿設定/金流設定/LINE Bot設定 |

## API 整合

### 認證

- POST `/api/admin/auth/login` - 管理員登入

### 待整合 API

所有頁面已預留 API 整合點，需要連接後端 API：

- `GET /api/admin/dashboard/stats` - 儀表板統計數據
- `GET /api/admin/rooms` - 房間列表
- `GET /api/admin/bookings` - 預訂列表
- `GET /api/admin/users` - 用戶列表
- `PUT /api/admin/settings/*` - 設定更新

## 功能特性

- ✅ 側邊欄導航（可摺疊）
- ✅ 響應式設計
- ✅ 數據表格（排序、篩選、分頁預留）
- ✅ 表單驗證
- ✅ Toast 通知
- ✅ Dialog 對話框
- ✅ Tabs 分頁
- ✅ 載入狀態（Skeleton）
- ✅ JWT 認證架構
- ⚠️ 圖表（預留，待 Day 5 實作）

## 開發規範

1. **禁止硬編碼** - 全部從 API 動態取得
2. **禁止靜態資料** - 所有資料來自資料庫
3. **參考前台設計規範** - 保持風格一致

## Docker 部署

```bash
docker build -t inn-saas-admin .
docker run -p 3001:3001 inn-saas-admin
```

## 環境變數

```env
NEXT_PUBLIC_API_URL=http://localhost:3000  # 後端 API 位址
```