# InnSaaS 後台功能補齊 - API 需求規格

## 1. 月曆檢視 API

### GET /api/admin/calendar/summary
取得指定月份的每日預訂概覽

**Query Parameters:**
- `year` (number, required): 年份
- `month` (number, required): 月份 (1-12)

**Response:**
```json
[
  {
    "date": "2026-03-09",
    "checkIns": 3,
    "checkOuts": 2,
    "occupiedRooms": 8,
    "totalRooms": 10,
    "availableRooms": 2,
    "pendingBookings": 1,
    "confirmedBookings": 5
  }
]
```

### GET /api/admin/calendar/daily
取得指定日期的訂單詳情

**Query Parameters:**
- `date` (string, required): 日期格式 YYYY-MM-DD

**Response:**
```json
{
  "date": "2026-03-09",
  "bookings": [...],
  "stats": {
    "checkIns": 3,
    "checkOuts": 2,
    "occupiedRooms": 8,
    "availableRooms": 2
  }
}
```

## 2. 價格設定 API

### GET /api/admin/pricing/room-types/:id
取得房型定價

**Response:**
```json
{
  "id": "rt_123",
  "roomTypeId": "rt_123",
  "weekdayPrice": 2800,
  "weekendPrice": 3200,
  "holidayPrice": 3500,
  "updatedAt": "2026-03-09T12:00:00Z"
}
```

### PUT /api/admin/pricing/room-types/:id
更新房型定價

**Request Body:**
```json
{
  "weekdayPrice": 2800,
  "weekendPrice": 3200,
  "holidayPrice": 3500
}
```

### GET /api/admin/pricing/special-prices
取得特殊日期定價列表

**Query Parameters:**
- `roomTypeId` (string, optional): 篩選特定房型

**Response:**
```json
[
  {
    "id": "sp_123",
    "roomTypeId": "rt_123",
    "startDate": "2026-02-10",
    "endDate": "2026-02-16",
    "price": 4500,
    "description": "春節假期",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  }
]
```

### POST /api/admin/pricing/special-prices
新增特殊日期定價

**Request Body:**
```json
{
  "roomTypeId": "rt_123",
  "startDate": "2026-02-10",
  "endDate": "2026-02-16",
  "price": 4500,
  "description": "春節假期"
}
```

### PUT /api/admin/pricing/special-prices/:id
更新特殊日期定價

### DELETE /api/admin/pricing/special-prices/:id
刪除特殊日期定價

## 3. 營收報表 API

### GET /api/admin/reports/revenue
取得營收報表

**Query Parameters:**
- `period` (enum, required): `week` | `month` | `year`
- `year` (number, optional): 年份
- `month` (number, optional): 月份 (1-12)

**Response:**
```json
{
  "period": "week",
  "startDate": "2026-03-03",
  "endDate": "2026-03-09",
  "totalRevenue": 150000,
  "totalBookings": 25,
  "averageDailyRate": 3000,
  "occupancyRate": 0.75,
  "data": [
    {
      "date": "2026-03-09",
      "label": "3/9",
      "revenue": 25000,
      "bookings": 5,
      "occupancyRate": 0.8
    }
  ]
}
```

### GET /api/admin/reports/occupancy
取得入住率統計

**Query Parameters:**
- `startDate` (string, required): 開始日期 YYYY-MM-DD
- `endDate` (string, required): 結束日期 YYYY-MM-DD

**Response:**
```json
[
  {
    "date": "2026-03-09",
    "rate": 0.8,
    "totalRooms": 10,
    "occupiedRooms": 8
  }
]
```

## 資料庫異動需求

### 新增表格

1. **room_type_pricing** - 房型定價
   - id (PK)
   - room_type_id (FK)
   - weekday_price
   - weekend_price
   - holiday_price
   - updated_at

2. **special_prices** - 特殊日期定價
   - id (PK)
   - room_type_id (FK)
   - start_date
   - end_date
   - price
   - description
   - created_at
   - updated_at

### 現有表格擴展

**room_types** 表格已有 `base_price`，需確認是否保留或遷移至新定價系統。
