# Geniideas Server

後端 Node.js 伺服器，使用 SQLite 資料庫儲存單線圖檔案。

## 安裝

```bash
npm install
```

## 啟動伺服器

```bash
npm start
```

或使用開發模式（自動重啟）：

```bash
npm run dev
```

伺服器將在 `http://localhost:3000` 啟動

## API 端點

### 取得所有檔案
```
GET /api/flowcharts
```

### 搜尋檔案
```
GET /api/flowcharts/search?q=關鍵字
```

### 取得單一檔案
```
GET /api/flowcharts/:id
```

### 建立新檔案
```
POST /api/flowcharts
Body: {
  project_name: "檔案名稱",
  data: { ... }
}
```

### 更新檔案
```
PUT /api/flowcharts/:id
Body: {
  project_name: "檔案名稱",
  data: { ... }
}
```

### 刪除檔案
```
DELETE /api/flowcharts/:id
```

## 資料庫

SQLite 資料庫檔案位於 `server/db/flowcharts.db`

包含以下表格：
- `flowcharts`: 儲存單線圖資料

