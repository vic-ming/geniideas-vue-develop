# LibreOffice 安裝指南

## 📋 什麼是 LibreOffice?

LibreOffice 是一個免費、開源的辦公軟體套件,Geniideas Flowchart 使用它來將 Excel 文件轉換為 PDF 格式。

---

## ⚠️ 重要說明

### **Excel 匯出功能**
- ✅ **不需要** LibreOffice
- ✅ 完全離線可用
- ✅ 直接點擊「匯出 Excel」即可

### **PDF 匯出功能**
- ⚠️ **需要** 安裝 LibreOffice
- 如果未安裝,會顯示錯誤訊息
- 安裝後即可使用

---

## 🚀 安裝步驟

### **步驟 1: 下載 LibreOffice**

#### 方法 A: 官方網站下載 (推薦)

1. 訪問官方網站:
   ```
   https://www.libreoffice.org/download/download/
   ```

2. 選擇版本:
   - 點擊 **"Download Version X.X.X"** (最新穩定版)
   - 選擇 **Windows x86_64 (64-bit)**

3. 下載文件:
   - 文件名類似: `LibreOffice_X.X.X_Win_x64.msi`
   - 大小約 300-400 MB

#### 方法 B: 直接下載連結

最新穩定版 (7.6.x):
```
https://download.documentfoundation.org/libreoffice/stable/
```

選擇最新版本 → win → x86_64 → 下載 `.msi` 文件

---

### **步驟 2: 安裝 LibreOffice**

1. **執行安裝程式**
   - 雙擊下載的 `.msi` 文件
   - 如果出現安全提示,點擊「執行」

2. **安裝選項**
   - 選擇「典型安裝」(Typical Installation)
   - 安裝位置保持默認:
     ```
     C:\Program Files\LibreOffice
     ```
   - ⚠️ **重要**: 不要更改安裝路徑,否則 Geniideas Flowchart 可能找不到

3. **完成安裝**
   - 點擊「安裝」(Install)
   - 等待安裝完成 (約 2-5 分鐘)
   - 點擊「完成」(Finish)

---

### **步驟 3: 驗證安裝**

#### 方法 1: 檢查程式是否存在

1. 按 `Win + R`
2. 輸入:
   ```
   C:\Program Files\LibreOffice\program\soffice.exe
   ```
3. 按 Enter
4. 如果 LibreOffice 啟動,表示安裝成功

#### 方法 2: 在 Geniideas Flowchart 中測試

1. 啟動 Geniideas Flowchart
2. 創建或打開一個專案
3. 點擊「匯出 PDF」
4. 如果成功生成 PDF,表示 LibreOffice 已正確安裝

---

## 🔧 常見問題

### **Q1: 安裝後仍然無法匯出 PDF**

**解決方案**:

1. **重啟 Geniideas Flowchart**
   - 完全關閉應用
   - 重新啟動

2. **檢查 LibreOffice 路徑**
   - 確認安裝在默認位置:
     ```
     C:\Program Files\LibreOffice\program\soffice.exe
     ```

3. **檢查防毒軟體**
   - 某些防毒軟體可能阻擋 LibreOffice
   - 將 LibreOffice 添加到白名單

---

### **Q2: 下載速度很慢**

**解決方案**:

使用鏡像站點下載:

**台灣鏡像**:
```
https://ftp.tku.edu.tw/LibreOffice/libreoffice/stable/
```

**日本鏡像**:
```
https://ftp.jaist.ac.jp/pub/LibreOffice/libreoffice/stable/
```

選擇最新版本 → win → x86_64 → 下載 `.msi` 文件

---

### **Q3: 我已經有 Microsoft Office,還需要 LibreOffice 嗎?**

**答案**: 是的,需要。

- Geniideas Flowchart 使用 LibreOffice 的命令行工具進行轉換
- Microsoft Office 不提供相同的命令行功能
- LibreOffice 是免費的,可以與 Microsoft Office 共存

---

### **Q4: LibreOffice 會影響我的 Microsoft Office 嗎?**

**答案**: 不會。

- LibreOffice 和 Microsoft Office 可以同時安裝
- 它們使用不同的文件關聯
- 互不干擾

---

### **Q5: 可以只安裝部分組件嗎?**

**答案**: 建議完整安裝。

- Geniideas Flowchart 只需要核心轉換功能
- 但完整安裝可以避免缺少依賴的問題
- 完整安裝約 600 MB

---

### **Q6: 安裝在其他位置可以嗎?**

**答案**: 不建議。

Geniideas Flowchart 會在以下位置尋找 LibreOffice:
```
C:\Program Files\LibreOffice\program\soffice.exe
C:\Program Files (x86)\LibreOffice\program\soffice.exe
```

如果安裝在其他位置,應用可能找不到。

---

## 🗑️ 解除安裝

如果不再需要 PDF 匯出功能,可以解除安裝 LibreOffice:

1. 設定 → 應用程式 → 已安裝的應用程式
2. 搜尋「LibreOffice」
3. 點擊「解除安裝」

**注意**: 解除安裝後,PDF 匯出功能將無法使用,但 Excel 匯出仍然可用。

---

## 📊 系統需求

### **最低需求**
- Windows 10 或更高版本
- 1.5 GB 可用硬碟空間
- 512 MB RAM

### **建議需求**
- Windows 10/11 (64-bit)
- 2 GB 可用硬碟空間
- 2 GB RAM

---

## 🎯 快速安裝指令

對於進階用戶,可以使用 PowerShell 自動下載和安裝:

```powershell
# 下載 LibreOffice (需要手動更新版本號)
$version = "7.6.4"
$url = "https://download.documentfoundation.org/libreoffice/stable/$version/win/x86_64/LibreOffice_${version}_Win_x64.msi"
$output = "$env:TEMP\LibreOffice.msi"

# 下載
Invoke-WebRequest -Uri $url -OutFile $output

# 安裝 (靜默安裝)
Start-Process msiexec.exe -ArgumentList "/i `"$output`" /qn /norestart" -Wait

# 清理
Remove-Item $output

Write-Host "LibreOffice 安裝完成!" -ForegroundColor Green
```

**注意**: 需要以管理員身份執行 PowerShell

---

## ✅ 安裝檢查清單

安裝完成後,請確認:

- [ ] LibreOffice 已安裝在默認位置
- [ ] 可以在開始菜單找到 LibreOffice
- [ ] 重啟 Geniideas Flowchart
- [ ] 測試 PDF 匯出功能
- [ ] PDF 成功生成並可以打開

---

## 📞 需要幫助?

如果遇到安裝問題:

1. **檢查安裝路徑**
   ```
   C:\Program Files\LibreOffice\program\soffice.exe
   ```

2. **查看應用日誌**
   ```
   %APPDATA%\geniideas-vue\logs\
   ```
   查找包含 "LibreOffice" 的錯誤訊息

3. **嘗試手動轉換**
   - 打開命令提示字元
   - 執行:
     ```cmd
     "C:\Program Files\LibreOffice\program\soffice.exe" --version
     ```
   - 應該顯示 LibreOffice 版本號

---

## 🔄 替代方案

如果無法安裝 LibreOffice,可以:

1. **使用 Excel 匯出**
   - 匯出為 Excel 格式
   - 使用 Microsoft Excel 或其他工具手動轉換為 PDF

2. **使用線上轉換工具**
   - 匯出 Excel 後
   - 使用線上 Excel 轉 PDF 服務

3. **使用其他 PDF 轉換軟體**
   - Adobe Acrobat
   - Microsoft Print to PDF (Windows 內建)

---

**版本**: 1.0.0  
**更新日期**: 2025-11-24  
**適用於**: Geniideas Flowchart Windows 版
