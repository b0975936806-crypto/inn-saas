# InnSaaS 民宿管理系統 - 設計規範

> 版本：v1.0  
> 更新日期：2026-03-08  
> 適用範圍：前台網站（Guest Portal）

---

## 1. 設計原則

### 1.1 核心價值
- **溫暖親切**：民宿是「家」的延伸，設計要傳達溫馨、放鬆的氛圍
- **簡潔高效**：預訂流程清晰，減少使用者決策負擔
- **信任專業**：視覺呈現專業度，建立使用者對平台的信任

### 1.2 設計語彙
- 使用圓角元素營造友善感
- 適度留白創造呼吸空間
- 色彩點綴突出行動號召（CTA）

---

## 2. 色彩系統

### 2.1 主色（Primary）
代表品牌、主要行動按鈕、重要資訊

| Token | Hex | HSL | 用途 |
|-------|-----|-----|------|
| `primary-50` | #eff6ff | 214 100% 97% | 背景強調 |
| `primary-100` | #dbeafe | 214 94% 93% | 淺色背景 |
| `primary-200` | #bfdbfe | 214 91% 85% | 懸停背景 |
| `primary-300` | #93c5fd | 214 92% 75% | 次要元素 |
| `primary-400` | #60a5fa | 214 94% 66% | 圖示、裝飾 |
| `primary-500` | #3b82f6 | 214 91% 60% | 主要強調 |
| `primary-600` | #2563eb | 214 89% 55% | **主按鈕** |
| `primary-700` | #1d4ed8 | 214 85% 52% | 按鈕懸停 |
| `primary-800` | #1e40af | 214 81% 40% | 文字連結 |
| `primary-900` | #1e3a8a | 214 80% 34% | 深色文字 |

**主色使用規範：**
- 主要按鈕背景：`primary-600`
- 按鈕懸停：`primary-700`
- 連結文字：`primary-600` 或 `primary-800`
- 重點標示背景：`primary-50` 或 `primary-100`

### 2.2 輔色（Accent）
用於特殊標示、促銷標籤、成功狀態

| Token | Hex | HSL | 用途 |
|-------|-----|-----|------|
| `accent-50` | #fdf4ff | 300 100% 98% | 淺色背景 |
| `accent-100` | #fae8ff | 300 90% 95% | 標籤背景 |
| `accent-200` | #f5d0fe | 300 85% 90% | 懸停狀態 |
| `accent-300` | #f0abfc | 300 80% 84% | 裝飾元素 |
| `accent-400` | #e879f9 | 300 75% 72% | 圖示 |
| `accent-500` | #d946ef | 300 70% 61% | 促銷標籤 |
| `accent-600` | #c026d3 | 300 65% 49% | 強調文字 |
| `accent-700` | #a21caf | 300 65% 43% | 深色強調 |

**輔色使用規範：**
- 特價標籤：`accent-500` 或 `accent-600`
- 推薦標示：`accent-100` 背景 + `accent-700` 文字
- 節慶主題：可暫時替換為 `accent-*`

### 2.3 中性色（Neutral）
用於文字、邊框、背景、分隔線

| Token | Hex | 用途 |
|-------|-----|------|
| `gray-50` | #f9fafb | 頁面背景 |
| `gray-100` | #f3f4f6 | 卡片背景、表格隔行 |
| `gray-200` | #e5e7eb | 邊框、分隔線 |
| `gray-300` | #d1d5db | 輸入框邊框 |
| `gray-400` | #9ca3af | 次要圖示 |
| `gray-500` | #6b7280 | 輔助文字、placeholder |
| `gray-600` | #4b5563 | 次要標題 |
| `gray-700` | #374151 | 主要文字 |
| `gray-800` | #1f2937 | 標題文字 |
| `gray-900` | #111827 | 最大強調文字 |

**中性色使用規範：**
- 主要文字：`gray-800` 或 `gray-900`
- 次要文字：`gray-500` 或 `gray-600`
- 輔助說明：`gray-400`
- 邊框：`gray-200`（輕）或 `gray-300`（重）
- 輸入框邊框：`gray-300`，懸停：`gray-400`
- 分隔線：`gray-200`
- 頁面背景：`gray-50` 或白色

### 2.4 功能色（Semantic Colors）

| 狀態 | 背景色 | 文字色 | 邊框色 | 用途 |
|------|--------|--------|--------|------|
| **成功 Success** | #dcfce7 (green-100) | #166534 (green-800) | #86efac (green-300) | 預訂成功、可用日期 |
| **警告 Warning** | #fef3c7 (amber-100) | #92400e (amber-800) | #fcd34d (amber-300) | 庫存緊張、即將截止 |
| **錯誤 Error** | #fee2e2 (red-100) | #991b1b (red-800) | #fca5a5 (red-300) | 預訂失敗、表單錯誤 |
| **資訊 Info** | #dbeafe (blue-100) | #1e40af (blue-800) | #93c5fd (blue-300) | 提示訊息、說明 |

### 2.5 色彩使用規則

#### 文字對比度
- 主要文字（標題、內文）：對比度 ≥ 4.5:1
- 大字標題（24px+）：對比度 ≥ 3:1
- 禁用文字：對比度約 2:1（需搭配其他視覺提示）

#### 色彩比例（60-30-10 法則）
- **60% 中性色**：頁面背景、卡片、主要內容
- **30% 主色**：按鈕、連結、導航、重要元素
- **10% 輔色/功能色**：標籤、狀態提示、裝飾

---

## 3. 字體規範

### 3.1 字體族

```css
--font-sans: 'Inter', 'Noto Sans TC', system-ui, -apple-system, sans-serif;
```

**說明：**
- 優先使用 Inter（英文）+ Noto Sans TC（中文）
- 系統備援：確保載入失敗時有合適替代字體

### 3.2 字級系統（Type Scale）

| 級別 | 大小 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| **Hero** | 48px (3rem) | 1.1 | 700 | 首頁大標題 |
| **H1** | 36px (2.25rem) | 1.2 | 700 | 頁面標題 |
| **H2** | 30px (1.875rem) | 1.25 | 600 | 區塊標題 |
| **H3** | 24px (1.5rem) | 1.3 | 600 | 卡片標題 |
| **H4** | 20px (1.25rem) | 1.4 | 600 | 小區塊標題 |
| **H5** | 18px (1.125rem) | 1.4 | 500 | 子標題 |
| **H6** | 16px (1rem) | 1.5 | 500 | 列表標題 |
| **Body Large** | 18px (1.125rem) | 1.6 | 400 | 重要內文 |
| **Body** | 16px (1rem) | 1.6 | 400 | 一般內文 |
| **Body Small** | 14px (0.875rem) | 1.5 | 400 | 次要內文 |
| **Caption** | 12px (0.75rem) | 1.5 | 400 | 說明文字、時間戳 |
| **Overline** | 12px (0.75rem) | 1.5 | 600 | 標籤、分類 |

### 3.3 字重規範

| 字重 | 值 | 用途 |
|------|-----|------|
| Regular | 400 | 內文、說明 |
| Medium | 500 | 按鈕文字、標籤 |
| Semibold | 600 | 標題、強調 |
| Bold | 700 | 大標題、重點 |

### 3.4 行高規範

| 情境 | 行高 | 說明 |
|------|------|------|
| 標題 | 1.2 - 1.3 | 緊湊，強調層級 |
| 內文 | 1.5 - 1.6 | 易讀性最佳 |
| 按鈕 | 1.25 | 垂直置中 |
| 表格 | 1.4 | 資料清晰呈現 |

### 3.5 響應式字級

| 級別 | Desktop (≥1024px) | Tablet (768-1023px) | Mobile (<768px) |
|------|-------------------|---------------------|-----------------|
| Hero | 48px | 40px | 32px |
| H1 | 36px | 32px | 28px |
| H2 | 30px | 26px | 24px |
| H3 | 24px | 22px | 20px |
| H4 | 20px | 18px | 18px |

---

## 4. 間距系統

### 4.1 基礎單位

以 **4px** 為最小單位，**8px** 為主要基準（0.5rem）

| Token | 值 | 用途 |
|-------|-----|------|
| `space-1` | 4px (0.25rem) | 圖示間距、緊密元素 |
| `space-2` | 8px (0.5rem) | **基礎單位**、小間距 |
| `space-3` | 12px (0.75rem) | 按鈕內間距、列表項 |
| `space-4` | 16px (1rem) | 卡片內間距、表單元素 |
| `space-5` | 20px (1.25rem) | 區塊內間距 |
| `space-6` | 24px (1.5rem) | 區塊間距 |
| `space-8` | 32px (2rem) | 大區塊間距 |
| `space-10` | 40px (2.5rem) | 區段間距 |
| `space-12` | 48px (3rem) | 頁面區段 |
| `space-16` | 64px (4rem) | 大區段分隔 |
| `space-20` | 80px (5rem) | Hero 區塊 |

### 4.2 元件間距

#### 按鈕 Padding
| 尺寸 | 垂直 | 水平 |
|------|------|------|
| Small | 6px | 12px |
| Medium | 10px | 16px |
| Large | 12px | 24px |

#### 卡片 Padding
| 密度 | 值 |
|------|-----|
| Compact | 16px |
| Default | 24px |
| Comfortable | 32px |

#### 表單元素間距
- 標籤與輸入框：8px
- 輸入框之間：16px
- 表單區塊之間：24px
- 表單與按鈕：32px

### 4.3 頁面佈局間距

| 元素 | 值 |
|------|-----|
| 頁面水平邊距（Desktop） | 64px |
| 頁面水平邊距（Tablet） | 32px |
| 頁面水平邊距（Mobile） | 16px |
| 最大內容寬度 | 1280px |
| 區塊垂直間距 | 80px |
| 卡片網格間距 | 24px |

---

## 5. 圓角規範

### 5.1 圓角尺度

| Token | 值 | 用途 |
|-------|-----|------|
| `radius-none` | 0 | 表格、特殊元素 |
| `radius-sm` | 4px | 小按鈕、標籤 |
| `radius-md` | 8px | **預設**、輸入框、卡片 |
| `radius-lg` | 12px | 大按鈕、卡片 |
| `radius-xl` | 16px | 大卡片、Modal |
| `radius-2xl` | 24px | Hero 區塊、Banner |
| `radius-full` | 9999px | 膠囊形按鈕、Avatar |

### 5.2 使用規則
- 按鈕預設：`radius-lg` (12px)
- 輸入框：`radius-md` (8px)
- 卡片：`radius-xl` (16px)
- Modal：`radius-2xl` (24px)
- 圖片：根據容器決定，保持與容器一致

---

## 6. 陰影規範

### 6.1 陰影尺度

| Token | 值 | 用途 |
|-------|-----|------|
| `shadow-none` | none | 平坦設計 |
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | 卡片預設 |
| `shadow-md` | 0 4px 6px -1px rgba(0,0,0,0.1) | 懸停狀態 |
| `shadow-lg` | 0 10px 15px -3px rgba(0,0,0,0.1) | Modal、Dropdown |
| `shadow-xl` | 0 20px 25px -5px rgba(0,0,0,0.1) | 彈出層 |
| `shadow-2xl` | 0 25px 50px -12px rgba(0,0,0,0.25) | 強調浮層 |

### 6.2 陰影使用規則

#### 卡片
- 預設：`shadow-sm`
- 懸停：`shadow-md`（搭配 transition）

#### 浮層元件（Modal、Dropdown）
- 使用 `shadow-lg` 或以上
- 配合較高的 z-index

#### 陰影顏色變化
- 淺色背景：使用預設黑色陰影
- 深色背景：使用白色半透明陰影 `rgba(255,255,255,0.1)`

---

## 7. 基礎元件規格

### 7.1 Button 按鈕

#### 變體（Variants）

| 變體 | 背景 | 文字 | 邊框 | 懸停背景 | 用途 |
|------|------|------|------|----------|------|
| **Primary** | `primary-600` | white | none | `primary-700` | 主要行動 |
| **Secondary** | `gray-100` | `gray-900` | none | `gray-200` | 次要行動 |
| **Outline** | white | `gray-700` | 2px `gray-300` | `gray-50` | 輔助操作 |
| **Ghost** | transparent | `gray-700` | none | `gray-100` | 低強度操作 |
| **Danger** | `red-600` | white | none | `red-700` | 刪除、危險操作 |

#### 尺寸（Sizes）

| 尺寸 | 高度 | 水平內距 | 字級 | 用途 |
|------|------|----------|------|------|
| **Small** | 32px | 12px | 14px | 表格內、緊密佈局 |
| **Medium** | 40px | 16px | 16px | **預設**、一般使用 |
| **Large** | 48px | 24px | 18px | Hero、重要 CTA |

#### 狀態（States）

| 狀態 | 樣式 |
|------|------|
| **Default** | 標準樣式 |
| **Hover** | 背景變深、可選擇陰影增強 |
| **Active** | 背景更深、略微縮小 scale(0.98) |
| **Disabled** | opacity: 0.5、cursor: not-allowed |
| **Loading** | 顯示旋轉動畫、禁用點擊 |
| **Focus** | ring: 2px primary-500、ring-offset: 2px |

#### 按鈕圖示規範
- 圖示與文字間距：8px
- 圖示大小：1em（與文字同高）
- 僅圖示按鈕：寬度 = 高度（正方形）

#### 程式碼範例
```tsx
<Button variant="primary" size="md">
  立即預訂
</Button>
<Button variant="outline" size="sm" isLoading>
  處理中
</Button>
```

---

### 7.2 Input 輸入框

#### 尺寸

| 屬性 | 值 |
|------|-----|
| 高度 | 44px（含邊框） |
| 水平內距 | 16px |
| 邊框寬度 | 1px |
| 圓角 | 8px (`radius-md`) |
| 字級 | 16px |

#### 狀態

| 狀態 | 邊框色 | 背景 | 其他 |
|------|--------|------|------|
| **Default** | `gray-300` | white | - |
| **Hover** | `gray-400` | white | - |
| **Focus** | `primary-500` | white | ring: 2px `primary-500` |
| **Error** | `red-500` | white | 下方顯示錯誤訊息 |
| **Disabled** | `gray-200` | `gray-50` | opacity: 0.6 |
| **Read-only** | `gray-200` | `gray-50` | - |

#### 標籤與輔助文字

| 元素 | 字級 | 顏色 | 間距 |
|------|------|------|------|
| Label | 14px | `gray-700` | 下方 8px |
| Helper Text | 14px | `gray-500` | 上方 8px |
| Error Text | 14px | `red-600` | 上方 8px |
| Required 標記 | 14px | `red-500` | Label 右側 |

#### 變體

| 變體 | 說明 |
|------|------|
| **Default** | 標準輸入框 |
| **With Icon** | 左側或右側圖示 |
| **With Button** | 右側內嵌按鈕 |

#### 程式碼範例
```tsx
<Input 
  label="姓名" 
  placeholder="請輸入您的姓名"
  required
/>
<Input 
  label="Email" 
  type="email"
  error="請輸入有效的 Email 格式"
/>
```

---

### 7.3 Select 下拉選單

#### 觸發器樣式
與 Input 相同，但右側顯示下拉箭頭圖示

#### 選項清單（Dropdown）

| 屬性 | 值 |
|------|-----|
| 背景 | white |
| 邊框 | 1px `gray-200` |
| 圓角 | 8px |
| 陰影 | `shadow-lg` |
| 最大高度 | 240px（可滾動） |
| 與觸發器間距 | 4px |

#### 選項項目

| 狀態 | 背景 | 文字 |
|------|------|------|
| **Default** | white | `gray-700` |
| **Hover** | `gray-50` | `gray-900` |
| **Selected** | `primary-50` | `primary-700` |
| **Disabled** | white | `gray-400` |

#### 選項項目尺寸
- 高度：40px
- 水平內距：16px
- 字級：16px

#### 程式碼範例
```tsx
<Select 
  label="房型"
  options={[
    { value: 'double', label: '雙人房' },
    { value: 'twin', label: '雙床房' },
    { value: 'suite', label: '套房' },
  ]}
/>
```

---

### 7.4 Card 卡片

#### 結構

```
┌─────────────────────────────────┐
│  [Image - 可選]                  │
├─────────────────────────────────┤
│  CardHeader                     │
│  ├─ CardTitle                   │
│  └─ CardDescription             │
├─────────────────────────────────┤
│  CardContent                    │
│  (主要內容區域)                  │
├─────────────────────────────────┤
│  CardFooter                     │
└─────────────────────────────────┘
```

#### 樣式變體

| 屬性 | 預設值 | 可選值 |
|------|--------|--------|
| Padding | 24px (`p-6`) | none (0), sm (16px), lg (32px) |
| Shadow | `shadow-sm` | none, `shadow-md`, `shadow-lg` |
| Hover 效果 | false | true（懸停時 shadow 增強） |

#### 外觀規格

| 屬性 | 值 |
|------|-----|
| 背景 | white |
| 邊框 | 1px `gray-200` |
| 圓角 | 16px (`radius-xl`) |
| 預設陰影 | `shadow-sm` |

#### 子元件樣式

**CardHeader**
- 底部間距：16px

**CardTitle**
- 字級：20px
- 字重：600
- 顏色：`gray-900`

**CardDescription**
- 字級：14px
- 顏色：`gray-500`
- 上方間距：4px

**CardFooter**
- 上方邊框：1px `gray-100`
- 上方間距：16px
- 上方內距：16px

#### 程式碼範例
```tsx
<Card padding="md" shadow="sm" hover>
  <CardHeader>
    <CardTitle>海景雙人房</CardTitle>
    <CardDescription>享有絕美海景的舒適空間</CardDescription>
  </CardHeader>
  <CardContent>
    <p>房間內容...</p>
  </CardContent>
  <CardFooter>
    <Button>查看詳情</Button>
  </CardFooter>
</Card>
```

---

### 7.5 Modal 對話框

#### 結構

```
┌─────────────────────────────────────────┐
│  Overlay (背景遮罩)                      │
│  ┌─────────────────────────────────┐    │
│  │  Modal                          │    │
│  │  ├─ ModalHeader                 │    │
│  │  │   ├─ Title                   │    │
│  │  │   └─ CloseButton             │    │
│  │  ├─ ModalBody                   │    │
│  │  └─ ModalFooter                 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

#### 尺寸變體

| 尺寸 | 最大寬度 | 用途 |
|------|----------|------|
| **Small** | 400px | 確認對話框、簡單提示 |
| **Medium** | 500px | **預設**、一般表單 |
| **Large** | 700px | 複雜表單、詳細資訊 |
| **Full** | 90vw | 全螢幕操作 |

#### 樣式規格

**Overlay（背景遮罩）**
- 背景：`rgba(0, 0, 0, 0.5)`
- 模糊效果：`backdrop-blur-sm`（可選）
- z-index：50

**Modal 本體**
- 背景：white
- 圓角：24px (`radius-2xl`)
- 陰影：`shadow-2xl`
- 最大高度：85vh（超出可滾動）

**ModalHeader**
- 內距：24px（上左右）
- 底部邊框：1px `gray-100`（可選）
- Title 字級：20px、字重 600

**CloseButton**
- 位置：右上角
- 尺寸：32px × 32px
- 圓角：full
- 懸停：`gray-100` 背景

**ModalBody**
- 內距：24px
- 可滾動區域

**ModalFooter**
- 內距：24px
- 頂部邊框：1px `gray-100`
- 按鈕排列：靠右對齊，間距 12px

#### 動畫規格

| 階段 | 持續時間 | 效果 |
|------|----------|------|
| **Open** | 200ms | Overlay fade in + Modal scale(0.95→1) + opacity(0→1) |
| **Close** | 150ms | 反向動畫 |
| **Easing** | - | ease-out |

#### 程式碼範例
```tsx
<Modal isOpen={isOpen} onClose={close} size="md">
  <ModalHeader>
    <ModalTitle>確認預訂</ModalTitle>
  </ModalHeader>
  <ModalBody>
    <p>請確認您的預訂資訊...</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={close}>取消</Button>
    <Button variant="primary">確認預訂</Button>
  </ModalFooter>
</Modal>
```

---

## 8. 響應式斷點

### 8.1 斷點定義

| 名稱 | 範圍 | Tailwind Prefix |
|------|------|-----------------|
| **Mobile** | < 640px | 預設 |
| **Tablet** | 640px - 1023px | `sm:` `md:` |
| **Desktop** | 1024px - 1279px | `lg:` |
| **Large Desktop** | ≥ 1280px | `xl:` `2xl:` |

### 8.2 容器寬度

| 斷點 | 最大寬度 |
|------|----------|
| Mobile | 100% - 32px (左右邊距) |
| Tablet | 100% - 64px |
| Desktop | 1024px |
| Large Desktop | 1280px |

### 8.3 響應式設計原則

#### 優先設計順序
1. 先設計 Mobile 版本
2. 擴展到 Tablet
3. 最後優化 Desktop

#### 佈局調整
| 元素 | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| 房型卡片 | 1 列 | 2 列 | 3-4 列 |
| 導航 | 漢堡選單 | 漢堡選單 | 水平選單 |
| 預訂表單 | 單欄 | 單欄 | 雙欄 |
| 圖片比例 | 16:9 | 4:3 | 4:3 |

---

## 9. 動畫與過渡

### 9.1 過渡時間

| 持續時間 | 用途 |
|----------|------|
| 100ms | 微小狀態變化（按鈕 active） |
| 150ms | 快速反饋（hover 效果） |
| 200ms | 標準過渡（顏色、邊框變化） |
| 300ms | 較慢過渡（ Modal、Dropdown） |

### 9.2 緩動函數

| 名稱 | 值 | 用途 |
|------|-----|------|
| **Ease** | ease | 一般過渡 |
| **Ease-out** | cubic-bezier(0, 0, 0.2, 1) | 元素出現 |
| **Ease-in** | cubic-bezier(0.4, 0, 1, 1) | 元素消失 |
| **Ease-in-out** | cubic-bezier(0.4, 0, 0.2, 1) | 雙向動畫 |

### 9.3 常用動畫

#### 按鈕 Hover
```css
transition: all 200ms ease;
/* Hover: background-color 變深 */
```

#### 卡片 Hover
```css
transition: box-shadow 200ms ease, transform 200ms ease;
/* Hover: shadow 增強 + 輕微上移 translateY(-2px) */
```

#### Modal 開關
```css
/* Open */
opacity: 0 → 1
transform: scale(0.95) → scale(1)
duration: 200ms
easing: ease-out

/* Close */
reverse animation
duration: 150ms
```

#### Loading 旋轉
```css
animation: spin 1s linear infinite;
```

---

## 10. 圖示規範

### 10.1 圖示尺寸

| 尺寸 | 用途 |
|------|------|
| 16px | 內文行內圖示 |
| 20px | 按鈕圖示、表單圖示 |
| 24px | 導航圖示、工具列 |
| 32px | 功能區塊圖示 |
| 48px | 大功能圖示 |

### 10.2 圖示顏色

| 情境 | 顏色 |
|------|------|
| 主要動作 | `primary-600` |
| 次要/說明 | `gray-400` |
| 成功 | `green-600` |
| 警告 | `amber-500` |
| 錯誤 | `red-600` |
| 資訊 | `blue-500` |

### 10.3 推薦圖示庫
- **Lucide React** - 主要圖示庫
- 保持一致性，不要混用多種風格

---

## 11. 無障礙設計（A11y）

### 11.1 色彩對比
- 文字與背景對比度 ≥ 4.5:1
- 大文字（18px+ bold 或 24px+）對比度 ≥ 3:1

### 11.2 鍵盤導航
- 所有互動元件可用 Tab 鍵訪問
- 焦點狀態清晰可見（使用 ring 效果）
- Modal 開啟時焦點限制在內部

### 11.3 語意化標籤
- 使用正確的 HTML 標籤（button、nav、main 等）
- 表單標籤與輸入框正確關聯
- 圖片提供 alt 文字

### 11.4 減少動畫
- 支援 `prefers-reduced-motion` 媒體查詢
- 提供關閉動畫的選項

---

## 12. 設計檢查清單

### 12.1 交付前檢查

#### 視覺一致性
- [ ] 色彩使用符合規範
- [ ] 字級、字重一致
- [ ] 間距使用 4px/8px 基準
- [ ] 圓角統一

#### 互動狀態
- [ ] 所有按鈕有 Hover、Active、Disabled 狀態
- [ ] 表單元素有 Focus 狀態
- [ ] 卡片有 Hover 效果（如適用）
- [ ] Loading 狀態設計

#### 響應式
- [ ] Mobile 版本設計完成
- [ ] Tablet 版本設計完成
- [ ] Desktop 版本設計完成
- [ ] 斷點切換順暢

#### 無障礙
- [ ] 對比度檢查通過
- [ ] 鍵盤操作流程清晰
- [ ] 表單標籤正確

---

## 附錄：Tailwind 對照表

### 顏色 Token 對照

| 設計 Token | Tailwind Class |
|------------|----------------|
| `primary-600` | `bg-primary-600` / `text-primary-600` |
| `gray-700` | `bg-gray-700` / `text-gray-700` |
| `red-500` | `bg-red-500` / `text-red-500` |

### 字級 Token 對照

| 設計 Token | Tailwind Class |
|------------|----------------|
| H1 (36px) | `text-4xl` |
| H2 (30px) | `text-3xl` |
| H3 (24px) | `text-2xl` |
| H4 (20px) | `text-xl` |
| Body (16px) | `text-base` |
| Body Small (14px) | `text-sm` |
| Caption (12px) | `text-xs` |

### 間距 Token 對照

| 設計 Token | Tailwind Class |
|------------|----------------|
| 4px | `p-1` / `m-1` / `gap-1` |
| 8px | `p-2` / `m-2` / `gap-2` |
| 16px | `p-4` / `m-4` / `gap-4` |
| 24px | `p-6` / `m-6` / `gap-6` |
| 32px | `p-8` / `m-8` / `gap-8` |
| 48px | `p-12` / `m-12` |
| 64px | `p-16` / `m-16` |

---

*文件結束*
