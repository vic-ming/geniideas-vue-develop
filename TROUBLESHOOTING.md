# Windows 安裝後無法啟動 - 故障排除指南

## 🔍 問題診斷

如果應用在 Windows 上安裝後無法啟動,請按照以下步驟診斷:

### 步驟 1: 檢查日誌文件

應用會自動生成日誌文件,位於:

```
C:\Users\[您的用戶名]\AppData\Roaming\geniideas-vue\logs\
```

**如何查看**:
1. 按 `Win + R`
2. 輸入: `%APPDATA%\geniideas-vue\logs`
3. 按 Enter
4. 打開最新的日誌文件 (例如: `app-2025-11-24.log`)

**查看內容**:
- 如果看到 "Application started successfully" - 應用啟動成功
- 如果看到錯誤訊息,記下錯誤內容

### 步驟 2: 檢查防火牆和防毒軟體

應用需要在本地啟動服務器 (localhost:3001),可能被防火牆阻擋:

1. **Windows Defender**:
   - 設定 → 更新與安全性 → Windows 安全性 → 病毒與威脅防護
   - 檢查是否有阻擋記錄

2. **防火牆**:
   - 設定 → 更新與安全性 → Windows 安全性 → 防火牆與網路保護
   - 允許應用程式通過防火牆
   - 找到 "Geniideas Flowchart" 並允許

### 步驟 3: 以管理員身份運行

1. 找到桌面捷徑或開始菜單中的應用
2. 右鍵點擊
3. 選擇「以系統管理員身分執行」

### 步驟 4: 檢查安裝路徑

確認應用安裝在正確的位置:

**默認安裝路徑**:
```
C:\Program Files\Geniideas Flowchart\
```

**檢查文件**:
- `Geniideas Flowchart.exe` - 主程式
- `resources\app.asar` - 應用資源
- `resources\app.asar.unpacked\` - 解壓的資源

## 🛠️ 常見問題修復

### 問題 1: 應用閃退,沒有任何提示

**原因**: 可能是 Electron 主進程崩潰

**解決方案**:
1. 重新安裝應用
2. 確保 Windows 10/11 已更新到最新版本
3. 安裝 Visual C++ Redistributable:
   - 下載: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - 安裝後重啟電腦

### 問題 2: 白屏或空白窗口

**原因**: 前端資源載入失敗

**解決方案**:
1. 檢查日誌文件中是否有 "index.html not found" 錯誤
2. 重新打包應用,確保 `dist/` 目錄已正確構建
3. 檢查 `package.json` 中的 `files` 配置

### 問題 3: 端口被占用

**原因**: 3001 端口已被其他程式使用

**解決方案**:
1. 打開命令提示字元 (以管理員身份)
2. 執行: `netstat -ano | findstr :3001`
3. 如果有輸出,表示端口被占用
4. 關閉占用端口的程式,或修改應用使用其他端口

### 問題 4: 數據庫初始化失敗

**原因**: 無法創建數據庫文件

**解決方案**:
1. 檢查用戶目錄權限
2. 手動創建目錄:
   ```
   C:\Users\[您的用戶名]\AppData\Roaming\geniideas-vue\db\
   ```
3. 確保有寫入權限

### 問題 5: better-sqlite3 模塊錯誤

**原因**: Native 模塊編譯問題

**解決方案**:
重新打包時確保使用正確的 Electron 版本:
```bash
npm rebuild better-sqlite3 --runtime=electron --target=28.0.0 --disturl=https://electronjs.org/headers
```

## 🔧 重新打包步驟

如果以上方法都無效,請重新打包:

### 1. 清理舊文件

```bash
# 刪除舊的構建文件
rm -rf dist release node_modules

# 重新安裝依賴
npm install
```

### 2. 確認前端構建成功

```bash
ELECTRON=true npm run build
```

檢查 `dist/` 目錄是否生成:
- `dist/index.html`
- `dist/assets/`

### 3. 重新打包

```bash
npm run electron:build:win
```

### 4. 測試打包結果

在打包前,先測試開發模式:
```bash
npm run electron:dev
```

如果開發模式正常,再進行打包。

## 📝 提供錯誤報告

如果問題仍未解決,請提供以下資訊:

1. **日誌文件內容** (位於 `%APPDATA%\geniideas-vue\logs\`)
2. **Windows 版本**: 
   - 按 `Win + R`
   - 輸入 `winver`
   - 截圖版本資訊

3. **安裝路徑**: 應用安裝在哪裡?

4. **錯誤訊息**: 有看到任何錯誤提示嗎?

5. **防毒軟體**: 使用什麼防毒軟體?

## ✅ 驗證修復

修復後,請驗證以下功能:

- [ ] 應用可以正常啟動
- [ ] 可以看到主界面
- [ ] 可以創建新專案
- [ ] 可以儲存專案
- [ ] 可以讀取專案
- [ ] 可以匯出 Excel
- [ ] 數據庫文件已創建 (檢查 `%APPDATA%\geniideas-vue\db\`)

## 🆘 緊急解決方案

如果急需使用,可以嘗試:

### 方案 1: 使用未打包版本

1. 進入 `release/win-unpacked/` 目錄
2. 直接執行 `Geniideas Flowchart.exe`

### 方案 2: 使用開發模式

如果有 Node.js 環境:
```bash
npm install
npm run electron:dev
```

---

**更新時間**: 2025-11-24  
**適用版本**: 1.0.0
