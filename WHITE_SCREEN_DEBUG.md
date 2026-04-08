# 白屏問題診斷指南

## 🎯 問題: 應用啟動後顯示全白畫面

新版本已經包含以下改進來幫助診斷和修復此問題:

---

## ✅ 新版本改進

### 1. **自動開啟開發者工具**
- 應用啟動時會自動打開開發者工具
- 可以直接查看控制台錯誤

### 2. **詳細的路徑日誌**
- 記錄所有嘗試的文件路徑
- 顯示哪個路徑找到了 index.html

### 3. **控制台訊息捕獲**
- 前端的所有 console.log 都會記錄到日誌文件
- 方便診斷 JavaScript 錯誤

---

## 🔍 診斷步驟

### **步驟 1: 查看開發者工具**

應用啟動後,會自動打開開發者工具:

1. **查看 Console 標籤**
   - 是否有紅色錯誤訊息?
   - 是否有資源載入失敗 (404)?

2. **查看 Network 標籤**
   - 刷新頁面 (F5)
   - 查看哪些文件載入失敗
   - 特別注意 CSS 和 JS 文件

3. **查看 Elements 標籤**
   - 是否有 HTML 內容?
   - 還是完全空白?

### **步驟 2: 查看日誌文件**

1. 按 `Win + R`
2. 輸入: `%APPDATA%\geniideas-vue\logs`
3. 打開最新的日誌文件

**查找以下關鍵訊息**:

```
✅ 成功的日誌應該包含:
[Electron] isDev: false
[Electron] Trying to find index.html in the following paths:
[Electron]   - [某個路徑] : EXISTS
[Electron] Loading production file: [找到的路徑]
[Electron] Page loaded successfully
```

```
❌ 如果有問題,可能看到:
[Electron] ERROR: index.html not found in any expected location!
[Electron] Failed to load: -6 ERR_FILE_NOT_FOUND
[Console 2] [錯誤訊息]
```

---

## 🛠️ 常見問題與解決方案

### **問題 1: 找不到 index.html**

**日誌顯示**: "index.html not found in any expected location"

**解決方案**:
1. 檢查打包是否完整
2. 重新打包:
   ```bash
   rm -rf dist release
   ELECTRON=true npm run build
   npm run electron:build:win
   ```

### **問題 2: CSS/JS 文件載入失敗**

**開發者工具顯示**: 404 錯誤,找不到 assets 文件

**原因**: Vite 構建時使用了絕對路徑

**解決方案**: 已在 `vite.config.js` 中設置 `base: './'`

### **問題 3: JavaScript 錯誤**

**開發者工具顯示**: 紅色 JavaScript 錯誤

**可能原因**:
- API 連接失敗 (localhost:3001)
- 前端代碼錯誤

**解決方案**:
1. 檢查日誌確認服務器已啟動:
   ```
   [Electron] ✅ 內部服務器運行於 http://localhost:3001
   ```
2. 如果服務器未啟動,檢查端口是否被占用

### **問題 4: 完全空白,沒有任何內容**

**Elements 標籤顯示**: 只有 `<html><head></head><body></body></html>`

**原因**: index.html 文件本身有問題

**解決方案**:
1. 檢查 `dist/index.html` 是否存在且有內容
2. 重新構建前端:
   ```bash
   rm -rf dist
   ELECTRON=true npm run build
   ```

---

## 📋 檢查清單

請依序檢查:

- [ ] 應用是否啟動 (有窗口出現)
- [ ] 開發者工具是否自動打開
- [ ] Console 是否有錯誤訊息
- [ ] Network 標籤是否有 404 錯誤
- [ ] 日誌文件是否顯示 "Page loaded successfully"
- [ ] 日誌文件是否顯示 "內部服務器運行於 http://localhost:3001"

---

## 🔧 使用開發者工具

### **打開/關閉開發者工具**
- 按 `F12` 或 `Ctrl + Shift + I`

### **刷新頁面**
- 按 `F5` 或 `Ctrl + R`

### **強制刷新 (清除緩存)**
- 按 `Ctrl + Shift + R`

### **查看完整錯誤**
- 在 Console 中點擊錯誤訊息
- 查看完整的堆疊追蹤

---

## 📸 收集診斷資訊

如果問題仍未解決,請收集以下資訊:

### 1. **截圖**
- 開發者工具的 Console 標籤
- 開發者工具的 Network 標籤
- 主窗口 (白屏)

### 2. **日誌文件**
- 完整的日誌文件內容
- 位置: `%APPDATA%\geniideas-vue\logs\`

### 3. **系統資訊**
- Windows 版本
- 安裝路徑
- 是否有防毒軟體

---

## 🆘 快速測試

### **測試 1: 檢查文件是否存在**

在安裝目錄中檢查:
```
C:\Program Files\Geniideas Flowchart\resources\app.asar
```

這個文件應該存在且大小約 1-2 MB。

### **測試 2: 檢查服務器**

在開發者工具 Console 中執行:
```javascript
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

應該看到:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

### **測試 3: 手動載入頁面**

在開發者工具 Console 中執行:
```javascript
location.reload()
```

查看是否有任何變化或新的錯誤訊息。

---

## 💡 臨時解決方案

如果急需使用,可以嘗試:

### **方案 1: 使用未打包版本**

1. 進入 `release/win-unpacked/` 目錄
2. 直接執行 `Geniideas Flowchart.exe`

### **方案 2: 開發模式** (需要 Node.js)

```bash
npm install
npm run electron:dev
```

---

**更新日期**: 2025-11-24  
**版本**: 1.0.0  
**狀態**: 包含診斷工具
