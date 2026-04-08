# Windows EXE 打包指南

## 📋 前置準備

### 1. 確認環境
```bash
node --version  # 建議 v18.x 或更高
npm --version   # 建議 v9.x 或更高
```

### 2. 安裝依賴
```bash
npm install
```

## 🚀 打包步驟

### 在 Mac 上交叉編譯 Windows 版本

```bash
# 完整打包命令
npm run electron:build:win
```

這個命令會:
1. 執行 `npm run build` - 構建 Vue 前端
2. 執行 `electron-builder --win --x64` - 打包 Windows 64位元版本

### 在 Windows 上編譯

如果您在 Windows 電腦上:
```bash
npm run electron:build
```

## 📦 打包輸出

打包完成後,您會在 `release` 目錄找到:

```
release/
├── Geniideas Flowchart Setup 1.0.0.exe  # Windows 安裝程式 (NSIS)
├── win-unpacked/                         # 未打包的應用程式文件
│   ├── Geniideas Flowchart.exe          # 可執行文件
│   ├── resources/                        # 資源文件
│   └── ...
└── builder-debug.yml                     # 構建日誌
```

### 主要文件說明

- **Geniideas Flowchart Setup 1.0.0.exe**: 
  - 這是最終的安裝程式
  - 用戶雙擊即可安裝
  - 包含完整的應用程式和依賴
  - 大小約 150-200 MB

- **win-unpacked/**: 
  - 這是解壓縮的應用程式
  - 可以直接運行 `Geniideas Flowchart.exe` 測試
  - 用於調試和測試

## 📦 LibreOffice 便攜版整合 (策略 A)

若希望安裝程式內建 LibreOffice 以支援離線 PDF 轉檔,請依下列步驟操作:

1. **取得便攜版**  
   - 從官方或可信來源下載 LibreOffice portable/無安裝版。  
   - 解壓後僅保留 `program/` 目錄即可 (包含 `soffice.exe` 等必要檔案)。

2. **放置到專案**  
   - 將 `program/` 內所有檔案複製到 `build/libreoffice/`。  
   - 專案已加入 `build/libreoffice/.gitkeep` 方便版本控制,真正打包時請以官方檔案覆蓋。  

3. **打包設定**  
   - `package.json` 的 `extraResources` 已配置:
     ```json
     {
       "from": "build/libreoffice",
       "to": "libreoffice",
       "filter": ["**/*"]
     }
     ```
   - electron-builder 會在打包時把上述資料夾複製到 `resources/libreoffice`, 電子應用程式啟動時會優先尋找 `resources/libreoffice/program/soffice.exe`。

4. **驗證**  
   - 執行 `npm run electron:build:win` 後,在 `release/win-unpacked/resources/libreoffice/program/` 確認是否存在 `soffice.exe`。  
   - 啟動 `Geniideas Flowchart.exe` 並測試 PDF 匯出,若成功則代表整合完成。  

> 注意: 加入 LibreOffice 會使安裝程式體積增加約 300–400 MB,請評估佈署與下載成本。

## ✅ 測試打包結果

### 方法 1: 測試安裝程式 (需要 Windows)
1. 將 `Geniideas Flowchart Setup 1.0.0.exe` 複製到 Windows 電腦
2. 雙擊運行安裝程式
3. 選擇安裝位置
4. 完成安裝
5. 從開始菜單或桌面啟動應用

### 方法 2: 測試未打包版本 (需要 Windows)
1. 進入 `release/win-unpacked/` 目錄
2. 雙擊 `Geniideas Flowchart.exe`
3. 應用應該直接啟動

## 🔧 常見問題

### 問題 1: 打包失敗 - "Cannot find module 'better-sqlite3'"

**解決方案**:
```bash
# 重新安裝依賴
rm -rf node_modules
npm install
npm run electron:build:win
```

### 問題 2: 打包失敗 - "Application entry file not found"

**解決方案**:
確認 `electron/main.js` 文件存在且正確

### 問題 3: Mac 上交叉編譯 Windows 失敗

**解決方案**:
```bash
# 安裝 Wine (用於在 Mac 上構建 Windows 應用)
brew install --cask wine-stable

# 或者使用 GitHub Actions / Windows 虛擬機進行構建
```

### 問題 4: 打包後文件太大

**原因**: Electron 應用包含完整的 Chromium 和 Node.js 運行時

**優化方案**:
- 已經使用了 NSIS 壓縮
- 可以考慮使用 7-Zip 進一步壓縮安裝程式
- 正常大小約 150-200 MB

### 問題 5: 安裝後無法啟動

**檢查項目**:
1. 檢查 Windows 防火牆設置
2. 檢查防毒軟體是否阻擋
3. 以管理員身份運行
4. 查看應用日誌 (位於 `%APPDATA%\geniideas-vue\logs\`)

## 📝 打包配置說明

打包配置位於 `package.json` 的 `build` 部分:

```json
{
  "build": {
    "appId": "com.geniideas.flowchart",
    "productName": "Geniideas Flowchart",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",      // Vue 構建輸出
      "electron/**/*",  // Electron 主進程文件
      "package.json"
    ],
    "win": {
      "target": "nsis"  // 使用 NSIS 安裝程式
    },
    "nsis": {
      "oneClick": false,                          // 允許選擇安裝位置
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,              // 創建桌面捷徑
      "createStartMenuShortcut": true,            // 創建開始菜單捷徑
      "shortcutName": "Geniideas Flowchart"
    }
  }
}
```

## 🎯 分發應用

### 給用戶的安裝說明

1. **下載**: 提供 `Geniideas Flowchart Setup 1.0.0.exe`
2. **安裝**: 
   - 雙擊安裝程式
   - 選擇安裝位置 (默認: `C:\Program Files\Geniideas Flowchart\`)
   - 點擊「安裝」
3. **啟動**: 
   - 從桌面捷徑啟動
   - 或從開始菜單搜尋「Geniideas Flowchart」

### 系統需求

- **作業系統**: Windows 10/11 (64-bit)
- **記憶體**: 最少 4GB RAM
- **硬碟**: 最少 500MB 可用空間
- **PDF 匯出** (可選): LibreOffice

## 📊 數據存儲

應用安裝後,用戶數據會存儲在:
```
C:\Users\[用戶名]\AppData\Roaming\geniideas-vue\
├── db\
│   ├── flowcharts.db
│   └── backups\
└── logs\
```

## 🔄 更新版本

要發布新版本:

1. 更新 `package.json` 中的版本號:
```json
{
  "version": "1.1.0"
}
```

2. 重新打包:
```bash
npm run electron:build:win
```

3. 新的安裝程式會命名為 `Geniideas Flowchart Setup 1.1.0.exe`

## 📋 檢查清單

打包前確認:
- [ ] 所有功能都已測試
- [ ] 已執行 `npm install`
- [ ] 已執行 `npm run build` 確認前端構建成功
- [ ] `electron/main.js` 和 `electron/preload.js` 存在
- [ ] (可選) 已添加應用圖標 `public/icon.ico`
- [ ] 已更新版本號
- [ ] 已測試開發模式 `npm run electron:dev`

打包後確認:
- [ ] `release` 目錄已生成
- [ ] 安裝程式文件存在
- [ ] (在 Windows 上) 測試安裝程式
- [ ] (在 Windows 上) 測試應用功能
- [ ] 確認所有功能正常 (儲存、讀取、匯出)

## 🎉 完成!

現在您可以將 `Geniideas Flowchart Setup 1.0.0.exe` 分發給用戶使用了!

---

**提示**: 如果遇到問題,請查看 `README_ELECTRON.md` 中的故障排除部分。
