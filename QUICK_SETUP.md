# 快速設置指南 - Vercel Postgres

## 錯誤：missing_connection_string

如果你看到這個錯誤，表示還沒有設置 Vercel Postgres 數據庫。

## 解決步驟（5 分鐘）

### 步驟 1：在 Vercel Dashboard 創建 Postgres 數據庫

根據你的界面，Postgres 現在通過 **Marketplace** 提供：

1. 登錄 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的項目：`geniideas-vue-develop`
3. 點擊頂部 **Storage** 標籤
4. 在 **Marketplace Database Providers** 區域，找到 **Prisma Postgres**
5. 點擊 **Prisma Postgres**（會顯示藍色高亮和勾選標記）
6. 在配置對話框中：
   - ✅ 勾選所有環境（Development, Preview, Production）
   - ⚠️ **重要**：將 **Custom Prefix** 改為 `POSTGRES`（不要使用 `STORAGE`）
     - 這樣環境變數會是 `POSTGRES_URL`，代碼才能正確識別
   - 點擊 **Connect**

**注意**：
- 如果已經使用 `STORAGE` 前綴連接了，代碼也支持 `STORAGE_URL`，但建議使用 `POSTGRES` 前綴
- 選擇 "Prisma Postgres" 是正確的！雖然名稱包含 Prisma，但我們使用的 `@vercel/postgres` 可以正常連接

### 步驟 2：等待數據庫創建完成

創建後，Vercel 會自動：
- ✅ 設置環境變數 `POSTGRES_URL`
- ✅ 將環境變數注入到所有 serverless functions
- ✅ 無需手動配置

### 步驟 3：重新部署

數據庫創建後，需要重新部署一次：

**選項 A：通過 Git 推送**
```bash
git commit --allow-empty -m "Trigger redeploy after Postgres setup"
git push
```

**選項 B：通過 Vercel Dashboard**
1. 進入項目
2. 點擊 **Deployments** 標籤
3. 點擊最新部署右側的 **⋯** 菜單
4. 選擇 **Redeploy**

### 步驟 4：驗證

部署完成後，測試：

```bash
# 創建記錄
POST https://geniideas-vue-develop.vercel.app/api/flowcharts

# 讀取記錄
GET https://geniideas-vue-develop.vercel.app/api/flowcharts/1
```

## 如果仍然有問題

### 檢查環境變數

1. 在 Vercel Dashboard 中，進入項目
2. 點擊 **Settings** > **Environment Variables**
3. 確認有以下變數（應該自動設置）：
   - `POSTGRES_URL`（主要使用這個）
   - `POSTGRES_PRISMA_URL`（如果使用 Prisma 才需要，但我們的代碼也支持）
   - `POSTGRES_URL_NON_POOLING`

**如果沒有自動設置**：
- 進入 **Storage** 標籤
- 點擊你創建的 Prisma Postgres 數據庫
- 在連接信息中複製連接字符串
- 手動添加到環境變數中

### 手動設置環境變數（如果需要）

如果環境變數沒有自動設置：

1. 在 Vercel Dashboard 中，進入 **Storage** 標籤
2. 點擊你的 Postgres 數據庫
3. 在 **Connection String** 部分，複製連接字符串
4. 進入 **Settings** > **Environment Variables**
5. 添加：
   - **Name**: `POSTGRES_URL`
   - **Value**: 貼上連接字符串
   - **Environment**: 選擇所有環境（Production, Preview, Development）

## 免費額度

**Hobby 計劃**（免費）包括：
- ✅ 256 MB 存儲
- ✅ 60 小時計算時間/月
- ✅ 適合小型項目

## 需要幫助？

如果按照以上步驟仍有問題，請檢查：
1. Vercel Dashboard 中的函數日誌（Functions 標籤）
2. 確認數據庫狀態為 "Active"
3. 確認環境變數已正確設置

