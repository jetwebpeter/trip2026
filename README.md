# B2B2C Tour — Vite + React + TS + SQLite

一個最小可跑的團體旅遊列表頁，對應前面規劃的 SQLite schema。

## 架構

```
b2b2c-tour/
├── backend/          Express + better-sqlite3 REST API (port 3001)
│   ├── init-db.js    建表 + 種子資料 + 設定 admin
│   ├── server.js     REST API (CRUD + 列表篩選)
│   └── tours.db      (執行 init-db 後產生)
└── frontend/         Vite + React + TypeScript (port 5173)
    └── src/
        ├── TourList.tsx    主元件
        ├── index.css       藍色主題樣式
        └── main.tsx
```

## 啟動步驟

### 1. 後端

```bash
cd backend
npm install
npm run init-db      # 建立 tours.db，塞入 8 筆範例行程 + admin (稅號 95495431)
npm start            # API 在 http://localhost:3001
```

### 2. 前端（另開一個終端）

```bash
cd frontend
npm install
npm run dev          # 開啟 http://localhost:5173
```

Vite 的 dev server 已設定 proxy，`/api/*` 會自動轉送到 `http://localhost:3001`，
所以前端程式碼只要寫 `fetch('/api/tours')` 即可，不會有 CORS 問題。

## API 端點

| Method | Path | 說明 |
|--------|------|------|
| GET    | `/api/tours` | 列表（支援 `region`, `days`, `maxPrice`, `keyword`, `sort`, `page`, `pageSize`）|
| GET    | `/api/tours/:id` | 單筆 + 航班 + 每日行程 |
| POST   | `/api/tours` | 新增 |
| PUT    | `/api/tours/:id` | 更新 |
| DELETE | `/api/tours/:id` | 刪除 |

### 範例

```bash
# 列出日本、5-6 天、價格低→高、第一頁
curl "http://localhost:3001/api/tours?region=日本&days=6&sort=price_asc&page=1"

# 關鍵字搜尋
curl "http://localhost:3001/api/tours?keyword=櫻花"

# 取單筆詳細
curl "http://localhost:3001/api/tours/GFG001"
```

## 已實作功能

- ✅ 篩選（目的地、天數、價格、關鍵字）— 關鍵字含 300ms debounce
- ✅ 排序（價格低→高、價格高→低、出發日期）— 後端 SQL ORDER BY
- ✅ 分頁 — 後端 LIMIT/OFFSET，每頁 6 筆
- ✅ 收藏 — localStorage 持久化
- ✅ 響應式 Grid — `auto-fit minmax(260px, 1fr)`
- ✅ 卡片 hover 動畫
- ✅ 熱銷 / 早鳥徽章
- ✅ 直售價（刪除線）+ 同業價 + 返點徽章

## 已設定的 admin

執行 `npm run init-db` 後，稅號 `95495431` 會被設為 admin，擁有權限：

```json
{
  "manage_products": true,
  "view_all_orders": true,
  "manage_users": true
}
```

驗證：

```bash
sqlite3 backend/tours.db "SELECT * FROM organizations WHERE tax_id='95495431';"
```

## 下一步建議

- 連接 `/api/tours/:id` 做詳細頁（英雄圖 + 頁籤 + sticky 側邊欄）
- 加入身份驗證（JWT）+ 依 `organizations.role` 控制 admin 後台路由
- PDF 匯出（`@react-pdf/renderer` 或後端 Puppeteer）
- 串接 Amadeus API 取代 mock flight 資料
# claude-b2b2c-tour
