# SQLite 在 Geniideas-Vue 專案的風險評估

## 📊 快速結論

**整體風險等級：🟡 中低風險**

在當前設計下，SQLite **不太可能**爆掉，但有幾個需要注意的潛在風險點。

---

## 🔍 風險分析

### 1. 📏 單檔案大小限制

#### SQLite 的理論限制
- **最大數據庫大小**：281 TB (理論上)
- **最大行大小**：1 GB
- **最大 TEXT/BLOB 欄位**：1 GB
- **最大表格數量**：無限制（實際受檔案系統限制）

#### 當前專案設置
```javascript
// server/index.js
app.use(express.json({ limit: '25mb' }));
```
- ✅ **JSON 請求大小限制：25MB**
- ✅ **單一流程圖數據限制：< 25MB**

#### 實際數據大小估算

假設一個**極端複雜**的流程圖：
- 100 個模組組 (modules)
- 每個模組包含：
  - 1 個源頭卡片 (~500 bytes)
  - 1 個管線卡片 (~200 bytes)
  - 1 個樓層卡片 (~150 bytes)
  - 5 個 Panel+Equipment 群組 (~2KB)
  - 10 個額外設備卡片 (~5KB)
  - 5 個分支模組 (~10KB)
  - 連接線數據 (~5KB)

**單一模組估算**：~23KB
**100 個模組**：~2.3MB
**加上其他元數據**：~3-5MB

**結論**：✅ 遠低於 25MB 限制，**單檔案大小安全**

---

### 2. 🔢 記錄數量限制

#### SQLite 限制
- **最大行數**：2^64 (18,446,744,073,709,551,616)
- 實際受限於磁碟空間

#### 當前專案場景
```sql
CREATE TABLE flowcharts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,
  ...
);
```

假設：
- **每個流程圖平均大小**：3MB
- **預期用戶數**：單用戶或小團隊（< 10 人）
- **預期流程圖數量**：100-1000 個

**總數據庫大小估算**：
- 100 個檔案：~300MB
- 1,000 個檔案：~3GB
- 10,000 個檔案：~30GB

**結論**：✅ **記錄數量完全安全**，SQLite 可以輕鬆處理

---

### 3. ⚡ 併發寫入風險 ⚠️

#### SQLite 的併發限制
- ✅ **讀取併發**：無限制，多個讀取可同時進行
- ⚠️ **寫入併發**：同一時間只允許一個寫入操作
- ⚠️ **鎖定機制**：使用檔案鎖（File Lock）

#### 當前專案場景

```javascript
// better-sqlite3 使用同步 API
stmt.create.run(project_name, JSON.stringify(data));
```

**潛在問題場景**：
1. **多用戶同時儲存**
   - 用戶 A 儲存流程圖 A
   - 用戶 B 同時儲存流程圖 B
   - 可能發生：`SQLITE_BUSY` 錯誤

2. **自動儲存衝突**
   - 如果實現自動儲存功能
   - 多個定時器同時觸發

3. **大量快速儲存**
   - 用戶快速點擊儲存按鈕
   - 短時間內大量寫入請求

#### 風險評估

| 場景 | 風險等級 | 說明 |
|------|----------|------|
| **單用戶使用** | 🟢 低風險 | 完全安全 |
| **2-5 人小團隊** | 🟡 中低風險 | 偶爾可能遇到鎖定 |
| **10+ 人同時使用** | 🔴 高風險 | 經常遇到寫入衝突 |
| **自動儲存功能** | 🟡 中風險 | 需要防抖動設計 |

**當前狀態**：🟡 **中低風險**
- 目前沒有自動儲存
- 手動儲存操作不頻繁
- 預期單用戶或小團隊

---

### 4. 🚀 性能瓶頸

#### 查詢性能

```javascript
// 列表查詢
stmt.getAll: SELECT * FROM flowcharts ORDER BY updated_at DESC

// 搜尋查詢
stmt.search: SELECT * FROM flowcharts WHERE project_name LIKE ?
```

**測試估算**：
- 100 條記錄：< 10ms
- 1,000 條記錄：< 50ms
- 10,000 條記錄：< 200ms

**結論**：✅ **查詢性能優秀**

#### 寫入性能

```javascript
// 插入操作
stmt.create: INSERT INTO flowcharts (project_name, data) VALUES (?, ?)

// 更新操作  
stmt.update: UPDATE flowcharts SET ... WHERE id = ?
```

**測試估算**：
- 小檔案（< 1MB）：< 50ms
- 中檔案（1-5MB）：< 200ms
- 大檔案（5-25MB）：< 1s

**結論**：✅ **寫入性能可接受**

---

### 5. 💾 磁碟空間

#### 計算方式

SQLite 使用 **B-tree** 結構，實際檔案大小 > 純數據大小：
- **開銷係數**：約 1.2-1.5x

假設 1,000 個流程圖（每個 3MB）：
- **純數據**：3GB
- **實際檔案大小**：3.6-4.5GB

**結論**：✅ **對現代硬碟來說微不足道**

---

## ⚠️ 實際風險場景

### 風險 #1：JSON 字串過大 (25MB 限制)

**觸發條件**：
- 超過 100+ 模組組
- 每個模組包含大量分支和設備
- 大量額外設備卡片

**機率**：🟡 **中低** (1-5%)
- 一般用戶不太可能創建如此複雜的流程圖
- 但企業級複雜專案可能觸發

**影響**：
- 無法儲存
- 前端錯誤：`413 Payload Too Large`

**緩解方案**：
```javascript
// 1. 增加限制
app.use(express.json({ limit: '50mb' }));

// 2. 前端檢查
if (JSON.stringify(data).length > 24 * 1024 * 1024) {
  alert('流程圖過於複雜，請分割成多個檔案');
}

// 3. 分頁/分段儲存
// 將大型流程圖拆分成多個檔案
```

---

### 風險 #2：併發寫入衝突

**觸發條件**：
- 多用戶同時儲存
- 實現自動儲存功能
- 快速連續儲存

**機率**：🟡 **中** (5-15%)
- 單用戶：幾乎不會發生
- 小團隊：偶爾發生
- 多用戶：頻繁發生

**影響**：
- `SQLITE_BUSY` 錯誤
- 儲存失敗
- 用戶體驗不佳

**緩解方案**：

#### 方案 A：重試機制
```javascript
// server/index.js
const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // ms

async function retryWrite(operation, retries = MAX_RETRIES) {
  try {
    return operation();
  } catch (error) {
    if (error.code === 'SQLITE_BUSY' && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryWrite(operation, retries - 1);
    }
    throw error;
  }
}

app.post('/api/flowcharts', async (req, res) => {
  try {
    const result = await retryWrite(() => 
      stmt.create.run(project_name, JSON.stringify(data))
    );
    res.json({ success: true, data: { ... } });
  } catch (error) {
    // ...
  }
});
```

#### 方案 B：寫入佇列
```javascript
// 使用佇列序列化寫入
class WriteQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  async add(operation) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const { operation, resolve, reject } = this.queue.shift();
    
    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.processing = false;
      this.process();
    }
  }
}

const writeQueue = new WriteQueue();

app.post('/api/flowcharts', async (req, res) => {
  try {
    const result = await writeQueue.add(() => 
      stmt.create.run(project_name, JSON.stringify(data))
    );
    res.json({ success: true, data: { ... } });
  } catch (error) {
    // ...
  }
});
```

#### 方案 C：WAL 模式
```javascript
// database.js
db.pragma('journal_mode = WAL');
```
- **WAL (Write-Ahead Logging)**
- 允許讀取和寫入並行
- 提高併發性能
- **強烈推薦！**

---

### 風險 #3：資料庫檔案損壞

**觸發條件**：
- 系統崩潰時正在寫入
- 磁碟空間不足
- 檔案系統錯誤
- 強制關機

**機率**：🟢 **低** (< 1%)
- SQLite 有 ACID 保證
- 使用 WAL 模式更安全

**影響**：
- 資料庫無法開啟
- 數據丟失

**緩解方案**：

#### 自動備份
```javascript
// 定期備份
const cron = require('node-cron');
const fs = require('fs');

// 每天凌晨 2 點備份
cron.schedule('0 2 * * *', () => {
  const backupPath = `./db/backup/flowcharts_${Date.now()}.db`;
  fs.copyFileSync('./db/flowcharts.db', backupPath);
  console.log('Database backed up:', backupPath);
});

// 保留最近 7 天的備份
// 刪除舊備份邏輯...
```

#### 檢查點優化
```javascript
// database.js
db.pragma('wal_autocheckpoint = 1000'); // 1000 頁後自動檢查點
```

---

### 風險 #4：全文搜尋性能

**當前實現**：
```sql
SELECT * FROM flowcharts WHERE project_name LIKE '%keyword%'
```

**問題**：
- 使用 `LIKE` 搜尋，無法使用索引
- 數據量大時性能下降

**機率**：🟡 **中** (10-20%)
- 1,000 條以下：無感
- 10,000 條以上：明顯變慢

**緩解方案**：

#### FTS (Full-Text Search)
```sql
-- 創建全文搜尋表
CREATE VIRTUAL TABLE flowcharts_fts USING fts5(
  project_name, 
  content='flowcharts', 
  content_rowid='id'
);

-- 插入觸發器
CREATE TRIGGER flowcharts_ai AFTER INSERT ON flowcharts BEGIN
  INSERT INTO flowcharts_fts(rowid, project_name) 
  VALUES (new.id, new.project_name);
END;

-- 搜尋
SELECT * FROM flowcharts 
WHERE id IN (
  SELECT rowid FROM flowcharts_fts 
  WHERE project_name MATCH 'keyword'
);
```

---

## 📈 擴展性建議

### 何時考慮遷移到其他資料庫？

| 指標 | SQLite 適合 | 建議遷移 |
|------|------------|----------|
| **用戶數** | < 10 人 | > 20 人 |
| **檔案數** | < 10,000 | > 50,000 |
| **資料庫大小** | < 10GB | > 50GB |
| **併發寫入** | < 5/秒 | > 20/秒 |
| **遠端訪問** | 不需要 | 需要 |

### 遷移路徑

```
SQLite (當前)
    ↓
PostgreSQL (推薦)
    ↓  
MongoDB (文檔型數據)
    ↓
專業方案 (高併發/分散式)
```

---

## 🛡️ 預防性措施清單

### 立即實施（推薦）✅

1. **啟用 WAL 模式**
```javascript
// database.js
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
```

2. **添加寫入重試機制**
```javascript
// 處理 SQLITE_BUSY 錯誤
```

3. **前端數據大小檢查**
```javascript
// 警告用戶流程圖過大
if (dataSize > 20MB) {
  alert('建議拆分成多個檔案');
}
```

4. **添加錯誤日誌**
```javascript
// 記錄所有 SQLite 錯誤
```

### 短期優化（建議）📋

5. **實施自動備份**
   - 每日備份
   - 保留 7-30 天

6. **添加資料庫健康檢查**
```javascript
// 定期檢查 PRAGMA integrity_check
```

7. **監控資料庫大小**
```javascript
// 當超過 1GB 時發出警告
```

### 長期規劃（可選）🔮

8. **考慮分頁加載**
   - 檔案列表分頁
   - 虛擬滾動

9. **實施緩存策略**
   - Redis 緩存熱門查詢
   - 減少數據庫壓力

10. **準備遷移計劃**
    - 當指標達到閾值時
    - 無縫遷移到 PostgreSQL

---

## 📊 監控指標

建議監控以下指標：

```javascript
// 簡單的監控中間件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});

// 定期檢查資料庫狀態
setInterval(() => {
  const stats = fs.statSync('./db/flowcharts.db');
  const sizeMB = stats.size / (1024 * 1024);
  
  if (sizeMB > 1000) {
    console.warn(`Database size: ${sizeMB}MB - Consider cleanup or migration`);
  }
}, 3600000); // 每小時檢查
```

---

## 🎯 總結

### 當前狀態評估

| 項目 | 狀態 | 評分 |
|------|------|------|
| **單檔案大小** | ✅ 安全 | 9/10 |
| **記錄數量** | ✅ 優秀 | 10/10 |
| **併發能力** | 🟡 可接受 | 6/10 |
| **查詢性能** | ✅ 良好 | 8/10 |
| **可靠性** | ✅ 良好 | 8/10 |

**綜合評分：8/10** - **適合當前場景**

### 最終建議

#### 對於單用戶或小團隊（< 10 人）
✅ **SQLite 完全夠用**，無需擔心

#### 對於中型團隊（10-20 人）
🟡 **需要實施優化措施**：
- 啟用 WAL 模式
- 添加重試機制
- 監控性能

#### 對於大型團隊（> 20 人）
⚠️ **建議規劃遷移**：
- 準備遷移到 PostgreSQL
- 實施寫入佇列
- 考慮微服務架構

### 風險等級總結

```
🟢 低風險 (0-3%)     - 不太可能發生
🟡 中風險 (3-15%)    - 可能發生，但可控
🟠 中高風險 (15-30%) - 較常發生，需優化
🔴 高風險 (> 30%)    - 頻繁發生，必須處理
```

**當前專案：🟡 中低風險**

SQLite 在這個專案中**不會爆掉**，但建議：
1. ✅ 立即啟用 WAL 模式
2. ✅ 添加錯誤處理和重試
3. ✅ 實施自動備份
4. 📋 監控關鍵指標
5. 🔮 準備擴展方案（未雨綢繆）

**結論：SQLite 是當前階段的最佳選擇！** 🎉

