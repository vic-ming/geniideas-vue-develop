# 快速開始指南

## 🎯 目標

將此 Vue 專案打包成 Windows 可執行的 .exe 檔案,支援完全離線運行,包含:
- ✅ 本地數據存儲 (SQLite)
- ✅ 儲存/讀取功能
- ✅ 匯出 Excel
- ✅ 匯出 PDF (需要 LibreOffice)

## 🚀 三步驟完成打包

### 步驟 1: 確認環境 ✓

已完成! 您的環境已配置好:
- ✅ Electron 已安裝
- ✅ electron-builder 已安裝
- ✅ 所有依賴已安裝

### 步驟 2: 測試開發模式 (可選但建議)

在打包前,先測試應用是否正常運行:

```bash
npm run electron:dev
```

這會啟動 Electron 應用,您可以測試所有功能。
按 `Ctrl+C` 停止。

### 步驟 3: 打包成 Windows EXE

```bash
npm run electron:build:win
```

**注意**: 
- 在 Mac 上執行此命令會交叉編譯 Windows 版本
- 打包過程需要 5-10 分鐘
- 完成後會在 `release/` 目錄生成安裝程式

## 📦 打包結果

打包完成後,您會得到:

```
release/
└── Geniideas Flowchart Setup 1.0.0.exe  ← 這就是最終的安裝程式!
```

**文件大小**: 約 150-200 MB (包含完整的 Chromium 和 Node.js 運行時)

## 💻 如何使用打包好的 EXE

### 在 Windows 電腦上:

1. **安裝**:
   - 雙擊 `Geniideas Flowchart Setup 1.0.0.exe`
   - 選擇安裝位置
   - 點擊「安裝」

2. **啟動**:
   - 從桌面捷徑啟動
   - 或從開始菜單搜尋「Geniideas Flowchart」

3. **使用**:
   - 完全離線運行,無需網路
   - 所有數據存儲在本地
   - 支援儲存、讀取、匯出 Excel/PDF

## 📁 數據存儲位置

安裝後,用戶數據會自動存儲在:

```
C:\Users\[用戶名]\AppData\Roaming\geniideas-vue\db\
├── flowcharts.db          # 主數據庫
└── backups/               # 自動備份
```

## ⚙️ 功能說明

### ✅ 已實現的離線功能

1. **本地數據存儲**
   - 使用 SQLite 數據庫
   - 自動備份機制
   - 數據永久保存

2. **儲存功能**
   - 創建新專案
   - 更新現有專案
   - 自動觸發備份

3. **讀取功能**
   - 列出所有專案
   - 搜尋專案
   - 載入專案數據

4. **匯出 Excel**
   - 使用 ExcelJS 庫
   - 完全離線生成
   - 無需外部依賴

5. **匯出 PDF**
   - 使用 jsPDF 庫生成 PDF
   - 或使用 LibreOffice 轉換 Excel 為 PDF
   - LibreOffice 需要用戶自行安裝

## 🔧 常見問題

### Q1: 打包後的 EXE 文件很大?
**A**: 正常現象。Electron 應用包含完整的瀏覽器引擎和 Node.js 運行時,所以文件較大(150-200 MB)。

### Q2: 需要安裝 LibreOffice 嗎?
**A**: 
- **Excel 匯出**: 不需要,完全離線可用
- **PDF 匯出**: 
  - 方案 1: 使用 jsPDF (已內建,無需安裝)
  - 方案 2: 使用 LibreOffice 轉換 (需要用戶安裝)

### Q3: 如何添加應用圖標?
**A**: 
1. 準備一個 256x256 的 .ico 文件
2. 放到 `public/icon.ico`
3. 在 `package.json` 的 `build.win` 中添加:
   ```json
   "icon": "public/icon.ico"
   ```
4. 重新打包

### Q4: 可以在 Mac 上打包 Windows 版本嗎?
**A**: 可以! 使用 `npm run electron:build:win` 即可交叉編譯。

### Q5: 用戶需要安裝什麼嗎?
**A**: 
- **必須**: Windows 10/11 (64-bit)
- **可選**: LibreOffice (如果需要 Excel 轉 PDF 功能)
- **不需要**: Node.js、npm、或任何開發工具

## 📚 更多資訊

- **詳細打包指南**: 查看 `PACKAGING_GUIDE.md`
- **Electron 使用說明**: 查看 `README_ELECTRON.md`
- **圖標準備**: 查看 `public/ICON_README.md`

## ✅ 檢查清單

打包前:
- [x] 已安裝所有依賴 (`npm install`)
- [x] 已配置 Electron
- [x] 已配置 electron-builder
- [ ] (可選) 已測試開發模式 (`npm run electron:dev`)
- [ ] (可選) 已添加應用圖標

打包:
- [ ] 執行 `npm run electron:build:win`
- [ ] 等待打包完成 (5-10 分鐘)
- [ ] 檢查 `release/` 目錄

測試:
- [ ] 在 Windows 電腦上測試安裝
- [ ] 測試儲存功能
- [ ] 測試讀取功能
- [ ] 測試匯出 Excel
- [ ] 測試匯出 PDF

## 🎉 完成!

現在您可以執行 `npm run electron:build:win` 開始打包了!

---

**需要幫助?** 查看詳細文檔:
- `PACKAGING_GUIDE.md` - 完整打包指南
- `README_ELECTRON.md` - Electron 應用說明
