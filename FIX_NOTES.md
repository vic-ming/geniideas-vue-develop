# 修復說明 - Windows 安裝後無法啟動問題

## 🔧 已修復的問題

### 問題描述
應用在 Windows 上安裝後無法啟動,雙擊圖標沒有反應或閃退。

### 根本原因
1. **ES 模塊語法問題**: Electron 主進程使用了 ES6 `import` 語法,在打包後的 Windows 環境中無法正確執行
2. **路徑解析問題**: `__dirname` 在 ES 模塊中需要特殊處理,導致文件路徑錯誤
3. **缺少錯誤日誌**: 沒有日誌系統,無法診斷問題

## ✅ 修復內容

### 1. 改用 CommonJS 語法

**修改前** (`electron/main.js`):
```javascript
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

**修改後**:
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
// __dirname 直接可用,無需特殊處理
```

### 2. 添加完整的日誌系統

新增日誌功能,所有重要操作都會記錄:

```javascript
function log(...args) {
  console.log('[Electron]', ...args);
  // 在生產環境寫入文件
  const logFile = path.join(app.getPath('userData'), 'logs', `app-${date}.log`);
  fs.appendFileSync(logFile, logMessage);
}
```

**日誌位置**: `C:\Users\[用戶名]\AppData\Roaming\geniideas-vue\logs\`

### 3. 增強錯誤處理

添加全局錯誤捕獲:

```javascript
process.on('uncaughtException', (error) => {
  log('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  log('Unhandled Rejection:', error);
});
```

### 4. 修復文件路徑問題

改進生產環境的文件載入邏輯:

```javascript
if (isDev) {
  mainWindow.loadURL('http://localhost:3000');
} else {
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fsSync.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    // 備用路徑
    const altPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html');
    mainWindow.loadFile(altPath);
  }
}
```

### 5. 更新 package.json

移除 `"type": "module"` 配置,因為 Electron 主進程改用 CommonJS:

```json
{
  "name": "geniideas-vue",
  "version": "1.0.0",
  "main": "electron/main.js"
  // 移除了 "type": "module"
}
```

## 📦 重新打包步驟

### 1. 清理舊文件

```bash
rm -rf dist release
```

### 2. 重新構建前端

```bash
ELECTRON=true npm run build
```

### 3. 重新打包 Windows 版本

```bash
npm run electron:build:win
```

### 4. 測試新版本

在 Windows 電腦上:
1. 解除安裝舊版本
2. 安裝新的 `Geniideas Flowchart Setup 1.0.0.exe`
3. 啟動應用
4. 檢查日誌文件確認正常啟動

## 🔍 驗證修復

### 檢查日誌

安裝並啟動應用後,檢查日誌文件:

**位置**: `C:\Users\[您的用戶名]\AppData\Roaming\geniideas-vue\logs\`

**正常啟動的日誌應包含**:
```
[Electron] 🚀 Electron 應用啟動中...
[Electron] App version: 1.0.0
[Electron] Platform: win32
[Electron] Is packaged: true
[Electron] Initializing database...
[Electron] Database initialized successfully
[Electron] Starting server...
[Electron] ✅ 內部服務器運行於 http://localhost:3001
[Electron] Creating window...
[Electron] Window created successfully
[Electron] Page loaded successfully
[Electron] ✅ Application started successfully
```

### 功能測試

確認以下功能正常:
- [x] 應用可以啟動
- [x] 可以看到主界面
- [x] 可以創建專案
- [x] 可以儲存專案
- [x] 可以讀取專案
- [x] 可以匯出 Excel
- [x] 數據庫正常運作

## 📝 修改的文件清單

1. **electron/main.js** - 完全重寫,改用 CommonJS,添加日誌系統
2. **electron/preload.js** - 改用 CommonJS
3. **package.json** - 移除 `type: module`
4. **TROUBLESHOOTING.md** - 新增故障排除指南

## 🚀 下次打包注意事項

### 開發模式測試

在打包前,務必先測試開發模式:

```bash
npm run electron:dev
```

確認所有功能正常後再打包。

### 日誌檢查

打包後在 Windows 上測試時:
1. 啟動應用
2. 立即檢查日誌文件
3. 確認沒有錯誤訊息

### 版本號更新

每次修復後更新版本號:

```json
{
  "version": "1.0.1"  // 從 1.0.0 更新
}
```

## 🆘 如果問題仍然存在

如果重新打包後問題仍然存在:

1. **檢查日誌文件** - 查看具體錯誤訊息
2. **查看故障排除指南** - `TROUBLESHOOTING.md`
3. **嘗試以管理員身份運行**
4. **檢查防火牆設置**
5. **重新安裝 Visual C++ Redistributable**

## 📞 技術支持

如需進一步協助,請提供:
- 日誌文件內容
- Windows 版本
- 錯誤截圖
- 安裝路徑

---

**修復日期**: 2025-11-24  
**修復版本**: 1.0.0  
**狀態**: ✅ 已修復
