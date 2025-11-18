# Vercel Postgres 設置指南

## 問題說明

在 Vercel serverless 環境中，SQLite 文件存儲在 `/tmp` 目錄，但每個函數實例都有獨立的 `/tmp`，導致數據無法在實例間共享。這就是為什麼保存的數據無法讀取的原因。

## 解決方案：使用 Vercel Postgres

已將代碼遷移到 Vercel Postgres，支持持久化存儲。

## 設置步驟

### 1. 在 Vercel Dashboard 中創建 Postgres 數據庫

1. 登錄 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的項目
3. 進入 **Storage** 標籤
4. 點擊 **Create Database**
5. 選擇 **Postgres**
6. 選擇計劃（Hobby 計劃有免費額度）
7. 創建數據庫

### 2. 連接數據庫到項目

創建數據庫後，Vercel 會自動：
- 設置環境變量（`POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`）
- 這些環境變量會自動注入到你的 serverless functions

### 3. 安裝依賴

```bash
npm install @vercel/postgres
```

### 4. 部署

代碼已經更新為使用 Postgres：
- `api/db-utils-postgres.js` - Postgres 數據庫工具
- 所有 API 文件已更新為使用 Postgres 版本

只需重新部署即可：

```bash
git add .
git commit -m "Migrate to Vercel Postgres"
git push
```

或者使用 Vercel CLI：

```bash
vercel --prod
```

## 代碼變更

### 主要變更

1. **新增文件**：
   - `api/db-utils-postgres.js` - Postgres 版本的數據庫工具

2. **更新的文件**：
   - `api/flowcharts.js` - 使用 Postgres
   - `api/flowcharts/[id].js` - 使用 Postgres
   - `api/flowcharts/search.js` - 使用 Postgres
   - `package.json` - 添加 `@vercel/postgres` 依賴

3. **SQL 語法變更**：
   - `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
   - `DATETIME` → `TIMESTAMP`
   - 觸發器語法適配 PostgreSQL

### 數據庫結構

PostgreSQL 表結構：

```sql
CREATE TABLE flowcharts (
  id SERIAL PRIMARY KEY,
  project_name TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 驗證設置

部署後，測試以下端點：

1. **創建記錄**：
   ```bash
   POST /api/flowcharts
   ```

2. **讀取記錄**：
   ```bash
   GET /api/flowcharts/1
   ```

3. **列出所有記錄**：
   ```bash
   GET /api/flowcharts
   ```

## 備註

- **備份功能**：`api/backup.js` 仍使用 SQLite，因為 Postgres 備份需要不同的實現方式
- **本地開發**：本地開發時仍可使用 SQLite（`api/db-utils.js`），只需切換導入即可
- **數據遷移**：如果需要遷移現有 SQLite 數據，可以使用數據導出/導入工具

## 故障排除

如果遇到問題：

1. **檢查環境變量**：確認 Vercel Dashboard 中已設置 Postgres 環境變量
2. **查看函數日誌**：在 Vercel Dashboard 的 Functions 標籤中查看錯誤日誌
3. **測試連接**：確認數據庫連接字符串正確

## 成本

- **Hobby 計劃**：免費額度包括：
  - 256 MB 存儲
  - 60 小時計算時間/月
  - 適合小型項目

- **Pro 計劃**：$20/月，包含更多資源

查看 [Vercel Postgres 定價](https://vercel.com/docs/storage/vercel-postgres/pricing) 了解更多。

