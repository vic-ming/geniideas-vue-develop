# Geniideas Flowchart 使用說明

## 🎉 歡迎使用 Geniideas Flowchart!

感謝您安裝 Geniideas Flowchart。本應用可以完全離線使用,所有數據都安全地存儲在您的電腦上。

---

## 🚀 快速開始

### 1. 啟動應用
- 從桌面捷徑啟動
- 或從開始菜單搜尋「Geniideas Flowchart」

### 2. 創建專案
- 點擊左側工具欄的「新增」圖標
- 輸入專案名稱
- 開始編輯流程圖

### 3. 儲存專案
- 點擊左側工具欄的「檔案」圖標
- 選擇「儲存檔案」
- 數據會自動保存到本地

### 4. 匯出
- **Excel**: 點擊 Excel 圖標,直接下載
- **PDF**: 點擊 PDF 圖標 (需要安裝 LibreOffice)

---

## 📦 功能說明

### ✅ 完全離線運行
- 無需網路連接
- 所有數據存儲在本地
- 自動備份保護

### ✅ 數據管理
- 創建、編輯、刪除專案
- 搜尋專案
- 自動保存

### ✅ 匯出功能
- Excel 匯出 (無需額外軟體)
- PDF 匯出 (需要 LibreOffice)

---

## 📋 PDF 匯出功能

### 如果您需要 PDF 匯出功能:

#### 步驟 1: 下載 LibreOffice
訪問: https://www.libreoffice.org/download/

#### 步驟 2: 安裝
- 選擇 Windows 64-bit 版本
- 使用默認安裝路徑
- 完成安裝

#### 步驟 3: 重啟應用
- 關閉 Geniideas Flowchart
- 重新啟動
- 現在可以使用 PDF 匯出功能

### 詳細安裝指南
請參考 `LIBREOFFICE_INSTALL_GUIDE.md` 文件

---

## 📁 數據存儲位置

您的專案數據存儲在:
```
C:\Users\[您的用戶名]\AppData\Roaming\geniideas-vue\db\
```

### 備份數據
- 自動備份位於 `db\backups\` 目錄
- 每次儲存時自動創建備份
- 建議定期複製整個 `db` 資料夾到安全位置

---

## ❓ 常見問題

### Q: 應用無法啟動?
**A**: 
1. 檢查防火牆設置
2. 以管理員身份運行
3. 查看日誌: `%APPDATA%\geniideas-vue\logs\`

### Q: PDF 匯出失敗?
**A**: 
1. 確認已安裝 LibreOffice
2. 檢查安裝路徑: `C:\Program Files\LibreOffice\`
3. 重啟應用

### Q: 數據會丟失嗎?
**A**: 
- 不會,所有數據都存儲在本地
- 自動備份保護
- 可以從備份恢復

### Q: 可以在多台電腦使用嗎?
**A**: 
- 可以,在每台電腦上安裝即可
- 數據需要手動複製
- 複製 `%APPDATA%\geniideas-vue\db\` 資料夾

---

## 🔧 系統需求

- Windows 10/11 (64-bit)
- 4GB RAM
- 500MB 硬碟空間
- (可選) LibreOffice 用於 PDF 匯出

---

## 📞 技術支持

### 日誌文件位置
```
C:\Users\[您的用戶名]\AppData\Roaming\geniideas-vue\logs\
```

### 快速訪問
1. 按 `Win + R`
2. 輸入: `%APPDATA%\geniideas-vue\logs`
3. 按 Enter

---

## 🎯 提示與技巧

### 1. 快速訪問數據目錄
- 按 `Win + R`
- 輸入: `%APPDATA%\geniideas-vue`
- 按 Enter

### 2. 備份數據
定期複製以下資料夾:
```
%APPDATA%\geniideas-vue\db\
```

### 3. 關閉開發者工具
- 應用啟動時會自動打開開發者工具
- 按 `F12` 可以關閉/打開

### 4. 搜尋專案
- 使用搜尋功能快速找到專案
- 支援模糊搜尋

---

## 📚 更多資訊

詳細文檔:
- `README_ELECTRON.md` - 完整功能說明
- `LIBREOFFICE_INSTALL_GUIDE.md` - LibreOffice 安裝指南
- `TROUBLESHOOTING.md` - 故障排除指南

---

## ✅ 安裝檢查清單

- [ ] 應用已成功安裝
- [ ] 可以正常啟動
- [ ] 可以創建專案
- [ ] 可以儲存專案
- [ ] 可以匯出 Excel
- [ ] (可選) 已安裝 LibreOffice
- [ ] (可選) 可以匯出 PDF

---

**感謝使用 Geniideas Flowchart!**

版本: 1.0.0  
更新日期: 2025-11-24
