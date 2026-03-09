# InnSaaS 專案檢查清單

## 一、硬編碼/靜態資料檢查清單（開發/測試用）

### 檢查方法
```bash
# 1. 掃描禁止關鍵字
grep -rn "mock\|fake\|假資料\|mock data\|fallback" \
  ~/projects/inn-saas/apps/admin/src/ \
  ~/projects/inn-saas/apps/web/src/ \
  --include="*.tsx" --include="*.ts"

# 2. 掃描硬編碼數字（可能是假資料）
grep -rn "totalBookings:\|totalRevenue:\|occupancyRate:" \
  ~/projects/inn-saas/apps/admin/src/ \
  --include="*.tsx" --include="*.ts"

# 3. 掃描 generate 函數（通常是假資料生成器）
grep -rn "generateRevenue\|generateMock\|generateData" \
  ~/projects/inn-saas/apps/admin/src/ \
  --include="*.tsx" --include="*.ts"
```

### 手動檢查項目

| 檢查項 | 方法 | 通過標準 |
|--------|------|---------|
| 斷網測試 | 關閉網路，重新整理頁面 | 顯示錯誤或載入中，**不顯示資料** |
| API 監控 | DevTools Network 面板 | 每個資料區塊都有對應的 API 請求 |
| Console 檢查 | DevTools Console 面板 | **無 "mock"、"假資料"、"fallback" 等字樣** |
| 資料合理性 | 檢查數字是否為整數 | 真實資料通常不會是 156、78% 等整數 |

---

## 二、API 規範檢查清單

### 必須檢查
- [ ] 所有 `fetch` 呼叫都有 `credentials: "include"`
- [ ] API 失敗時顯示錯誤訊息（不回落到假資料）
- [ ] 無硬編碼 API URL（使用環境變數或相對路徑）

### 檢查命令
```bash
grep -rn "fetch(" ~/projects/inn-saas/apps/admin/src/ \
  --include="*.tsx" --include="*.ts" | grep -v "credentials"
```

---

## 三、Code Review 檢查清單（Review 時必做）

### Reviewer 檢查項
- [ ] 程式碼中無 `mock`、`fake`、`假資料` 等字樣
- [ ] 無 `try { api } catch { 設置資料 }` 模式
- [ ] 所有資料都來自 API 響應
- [ ] 錯誤處理僅顯示錯誤訊息，不設置默認資料
- [ ] 無硬編碼數字、字串作為資料展示

---

## 四、後台管理功能對照檢查

### 規劃功能 vs 實際功能

| 模組 | 規劃功能 | 實際功能 | 狀態 |
|------|---------|---------|------|
| **登入** | JWT 登入、Token 儲存 | ? | 待確認 |
| **儀表板** | 營收統計、入住率、預訂趨勢 | ? | 待確認 |
| **房型管理** | CRUD、圖片上傳、價格設定 | ? | 待確認 |
| **房間管理** | 房號、樓層、狀態管理 | ? | 待確認 |
| **預訂管理** | 預訂列表、狀態更新、入住/退房 | ? | 待確認 |
| **用戶管理** | 員工帳號、權限管理 | ? | 待確認 |
| **付款管理** | 綠界、LINE Pay 整合 | ? | 待確認 |
| **LINE Bot** | 設定、推播訊息 | ? | 待確認 |

---

## 五、每日自動檢查（CI/CD）

### 建議加入 CI 的檢查
```yaml
# .github/workflows/check-mock.yml
name: Check Mock Data
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check for mock data
        run: |
          if grep -rn "mock\|fake\|假資料" apps/admin/src/ apps/web/src/; then
            echo "❌ Found mock data!"
            exit 1
          fi
      - name: Check for hardcoded values
        run: |
          if grep -rn "totalBookings:\|totalRevenue:" apps/admin/src/; then
            echo "❌ Found hardcoded values!"
            exit 1
          fi
```

---

## 六、測試員驗收清單

### 測試前必做
1. [ ] 斷網測試 - 所有頁面
2. [ ] API 監控 - 確認每個資料區塊都有 API 請求
3. [ ] Console 檢查 - 無 mock 相關日誌

### 功能測試
1. [ ] 登入/登出流程
2. [ ] 各頁面資料載入
3. [ ] 錯誤處理（如 401、500）

---

**建立日期：** 2026-03-09  
**版本：** v1.0
