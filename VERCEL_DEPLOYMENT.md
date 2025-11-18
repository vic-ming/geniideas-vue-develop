# Vercel 部署說明

本專案已配置為可在 Vercel 上部署，後端 API 已轉換為 Vercel Serverless Functions。

## 部署步驟

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **構建專案**
   ```bash
   npm run build
   ```

3. **部署到 Vercel**
   - 使用 Vercel CLI：
     ```bash
     npm i -g vercel
     vercel
     ```
   - 或通過 Vercel Dashboard：
     - 連接你的 GitHub 倉庫
     - Vercel 會自動檢測配置並部署

## 重要注意事項

### 數據庫持久化

⚠️ **重要**：在 Vercel Serverless 環境中，`/tmp` 目錄的數據在函數調用之間**不會持久化**。這意味著：

1. **開發環境**：數據會保存在本地 `server/db/` 目錄
2. **Vercel 生產環境**：數據存儲在 `/tmp` 目錄，但不會持久化

### 解決方案

如果需要持久化數據，建議：

1. **使用 Vercel Postgres**（推薦）
   - 在 Vercel Dashboard 中創建 Postgres 數據庫
   - 修改 `api/db-utils.js` 使用 Postgres 而不是 SQLite

2. **使用外部數據庫服務**
   - 如 Supabase、PlanetScale、Railway 等
   - 修改數據庫連接配置

3. **使用 Vercel KV 或 Blob Storage**
   - 對於較小的數據集，可以使用 Vercel 的存儲服務

### PDF 導出功能

PDF 導出功能依賴 LibreOffice，在 Vercel 環境中不可用。如果需要此功能：

1. 使用客戶端 PDF 生成（如 jsPDF，已在專案中）
2. 或使用外部 API 服務進行轉換

## 項目結構

```
.
├── api/                    # Vercel Serverless Functions
│   ├── flowcharts.js      # GET, POST /api/flowcharts
│   ├── flowcharts/
│   │   ├── [id].js        # GET, PUT, DELETE /api/flowcharts/:id
│   │   └── search.js      # GET /api/flowcharts/search
│   ├── export-flowchart/
│   │   └── pdf.js         # POST /api/export-flowchart/pdf
│   ├── backup.js          # GET, POST /api/backup
│   └── db-utils.js        # 數據庫工具函數
├── src/                    # Vue.js 前端代碼
├── server/                 # 原始 Express 服務器（本地開發用）
├── vercel.json            # Vercel 配置文件
└── package.json
```

## API 端點

所有 API 端點現在使用相對路徑 `/api/...`，不再需要硬編碼 `localhost:3001`。

- `GET /api/flowcharts` - 獲取所有流程圖
- `POST /api/flowcharts` - 創建新流程圖
- `GET /api/flowcharts/:id` - 獲取單個流程圖
- `PUT /api/flowcharts/:id` - 更新流程圖
- `DELETE /api/flowcharts/:id` - 刪除流程圖
- `GET /api/flowcharts/search?q=...` - 搜索流程圖
- `POST /api/backup` - 創建備份
- `GET /api/backups` - 列出備份
- `POST /api/export-flowchart/pdf` - 導出 PDF（Vercel 環境中不可用）

## 本地開發

本地開發時，可以：

1. **使用 Vite 開發服務器**（前端）：
   ```bash
   npm run dev
   ```
   前端會通過 Vite 的 proxy 連接到後端

2. **使用原始 Express 服務器**（後端）：
   ```bash
   cd server
   npm install
   npm start
   ```

## 環境變量

在 Vercel Dashboard 中可以設置以下環境變量：

- `VERCEL=1` - 自動設置，表示在 Vercel 環境中運行
- `LIBREOFFICE_BIN` - LibreOffice 可執行文件路徑（如果需要 PDF 轉換）

## 故障排除

如果遇到問題：

1. 檢查 Vercel 函數日誌
2. 確認所有依賴已正確安裝
3. 檢查數據庫文件權限
4. 確認 API 路由配置正確

