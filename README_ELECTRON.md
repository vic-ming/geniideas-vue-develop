# Geniideas Flowchart - Electron 桌面應用

這是一個基於 Vue 3 + Electron 的流程圖桌面應用程式,可以在 Windows 上離線運行。

## ✨ 功能特點

- ✅ **完全離線運行** - 無需網路連接
- ✅ **本地數據存儲** - 使用 SQLite 數據庫
- ✅ **自動備份** - 數據自動備份保護
- ✅ **Excel 匯出** - 支持匯出為 Excel 格式
- ✅ **PDF 匯出** - 支持匯出為 PDF 格式 (需要安裝 LibreOffice)
- ✅ **搜尋功能** - 快速搜尋專案
- ✅ **流程圖編輯** - 完整的流程圖編輯功能

## 📋 系統需求

- **作業系統**: Windows 10/11 (64-bit)
- **記憶體**: 最少 4GB RAM
- **硬碟空間**: 最少 500MB 可用空間
- **PDF 匯出** (可選): LibreOffice (用於 Excel 轉 PDF 功能)

## 🚀 開發模式

### 安裝依賴

```bash
npm install
```

### 啟動開發模式

```bash
npm run electron:dev
```

這會同時啟動:
1. Vite 開發服務器 (前端)
2. Electron 應用程式 (桌面窗口)
3. 內建 Express 服務器 (後端 API)

## 📦 打包為 Windows EXE

### 方法 1: 在 Mac 上交叉編譯 Windows 版本

```bash
npm run electron:build:win
```

### 方法 2: 在 Windows 上編譯

```bash
npm run electron:build
```

打包完成後,安裝程式會生成在 `release` 目錄中:
- `Geniideas Flowchart Setup x.x.x.exe` - Windows 安裝程式

## 📁 數據存儲位置

應用程式的數據會存儲在以下位置:

**Windows**:
```
C:\Users\[用戶名]\AppData\Roaming\geniideas-vue\db\
├── flowcharts.db          # 主數據庫
├── flowcharts.db-shm      # SQLite 共享記憶體文件
├── flowcharts.db-wal      # SQLite 寫前日誌
└── backups/               # 自動備份目錄
    ├── flowcharts_auto-create_[時間戳].db
    ├── flowcharts_auto-update_[時間戳].db
    └── flowcharts_manual_[時間戳].db
```

## 🔧 配置說明

### PDF 匯出功能

PDF 匯出功能需要 LibreOffice。如果未安裝,Excel 匯出仍然可以正常使用。

**安裝 LibreOffice**:
1. 下載: https://www.libreoffice.org/download/download/
2. 安裝到默認位置
3. 重啟應用程式

應用程式會自動檢測以下位置的 LibreOffice:
- `C:\Program Files\LibreOffice\program\soffice.exe`
- `C:\Program Files (x86)\LibreOffice\program\soffice.exe`

## 📝 使用說明

### 1. 創建新專案
- 點擊「新增專案」按鈕
- 輸入專案名稱
- 開始編輯流程圖

### 2. 保存專案
- 點擊「儲存」按鈕
- 數據會自動保存到本地數據庫
- 系統會自動創建備份

### 3. 匯出功能
- **Excel**: 點擊「匯出 Excel」直接下載
- **PDF**: 點擊「匯出 PDF」(需要 LibreOffice)

### 4. 搜尋專案
- 使用頂部搜尋框
- 輸入專案名稱關鍵字
- 即時顯示搜尋結果

### 5. 備份管理
- 自動備份: 每次創建/更新時自動備份 (30秒冷卻時間)
- 手動備份: 點擊「創建備份」按鈕
- 備份位置: 查看上方「數據存儲位置」

## 🛠️ 技術架構

### 前端
- **Vue 3** - 漸進式 JavaScript 框架
- **Vite** - 快速的前端構建工具
- **ExcelJS** - Excel 文件生成
- **jsPDF** - PDF 文件生成
- **html2canvas** - HTML 轉圖片

### 後端
- **Electron** - 跨平台桌面應用框架
- **Express** - Node.js Web 框架
- **better-sqlite3** - 高性能 SQLite 數據庫
- **LibreOffice** - Excel 轉 PDF (可選)

### 打包
- **electron-builder** - Electron 應用打包工具

## 🐛 故障排除

### 問題 1: 應用無法啟動
- 檢查是否有其他實例正在運行
- 檢查 3001 端口是否被占用
- 查看應用日誌

### 問題 2: PDF 匯出失敗
- 確認已安裝 LibreOffice
- 檢查 LibreOffice 安裝路徑
- 使用 Excel 匯出作為替代方案

### 問題 3: 數據丟失
- 檢查備份目錄
- 從備份恢復數據
- 備份文件可以直接替換主數據庫文件

### 問題 4: 打包失敗
- 確認已安裝所有依賴: `npm install`
- 清除緩存: `rm -rf node_modules dist release && npm install`
- 檢查 Node.js 版本 (建議 18.x 或更高)

## 📄 許可證

此專案僅供內部使用。

## 🤝 支持

如有問題或建議,請聯繫開發團隊。

---

**版本**: 1.0.0  
**最後更新**: 2025-11-24
