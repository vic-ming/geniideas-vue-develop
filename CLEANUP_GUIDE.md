# 完全清理並重新安裝指南

## 🎯 問題: "Installer integrity check has failed"

這表示安裝程式文件損壞。需要手動清理後重新安裝。

---

## 🧹 完全清理步驟

### **步驟 1: 手動刪除程式文件**

#### 方法 A: 使用檔案總管
1. 打開檔案總管
2. 前往以下位置並刪除資料夾:

**程式文件** (選擇您的安裝位置):
```
C:\Program Files\Geniideas Flowchart\
```
或
```
C:\Users\[您的用戶名]\AppData\Local\Programs\Geniideas Flowchart\
```

3. 如果提示「需要管理員權限」→ 點擊「繼續」
4. 如果提示「文件正在使用」→ 繼續下一個方法

#### 方法 B: 使用 PowerShell (管理員)
1. 按 `Win + X`
2. 選擇「Windows PowerShell (系統管理員)」或「終端機 (系統管理員)」
3. 執行以下命令:

```powershell
# 刪除 Program Files 中的安裝
Remove-Item "C:\Program Files\Geniideas Flowchart" -Recurse -Force -ErrorAction SilentlyContinue

# 刪除 AppData\Local 中的安裝
Remove-Item "$env:LOCALAPPDATA\Programs\Geniideas Flowchart" -Recurse -Force -ErrorAction SilentlyContinue

# 刪除開始菜單捷徑
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Geniideas Flowchart.lnk" -Force -ErrorAction SilentlyContinue

# 刪除桌面捷徑
Remove-Item "$env:USERPROFILE\Desktop\Geniideas Flowchart.lnk" -Force -ErrorAction SilentlyContinue

Write-Host "清理完成!" -ForegroundColor Green
```

---

### **步驟 2: 清理註冊表**

#### 方法 A: 手動清理
1. 按 `Win + R`
2. 輸入 `regedit` 並按 Enter
3. 前往以下位置:

```
HKEY_CURRENT_USER\Software\geniideas-vue
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\
```

4. 找到包含 "Geniideas" 的項目
5. 右鍵 → 刪除

#### 方法 B: 使用 PowerShell (管理員)
```powershell
# 清理用戶註冊表
Remove-Item "HKCU:\Software\geniideas-vue" -Recurse -Force -ErrorAction SilentlyContinue

# 清理卸載信息
Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" | 
    Where-Object { $_.GetValue("DisplayName") -like "*Geniideas*" } | 
    ForEach-Object { Remove-Item $_.PSPath -Recurse -Force }

Write-Host "註冊表清理完成!" -ForegroundColor Green
```

---

### **步驟 3: 清理用戶數據** (可選)

⚠️ **警告**: 這會刪除所有專案數據!

#### 如果要保留數據:
**先備份**:
1. 按 `Win + R`
2. 輸入 `%APPDATA%\geniideas-vue`
3. 複製整個 `db` 資料夾到安全位置

#### 清理數據:
```powershell
# 刪除應用數據
Remove-Item "$env:APPDATA\geniideas-vue" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "用戶數據清理完成!" -ForegroundColor Green
```

---

### **步驟 4: 完整清理腳本** (一鍵執行)

創建一個 PowerShell 腳本文件 `cleanup.ps1`:

```powershell
# Geniideas Flowchart 完全清理腳本
# 以管理員身份運行

Write-Host "開始清理 Geniideas Flowchart..." -ForegroundColor Cyan

# 1. 刪除程式文件
Write-Host "`n[1/4] 刪除程式文件..." -ForegroundColor Yellow
Remove-Item "C:\Program Files\Geniideas Flowchart" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:LOCALAPPDATA\Programs\Geniideas Flowchart" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ 程式文件已刪除" -ForegroundColor Green

# 2. 刪除捷徑
Write-Host "`n[2/4] 刪除捷徑..." -ForegroundColor Yellow
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Geniideas Flowchart.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\Desktop\Geniideas Flowchart.lnk" -Force -ErrorAction SilentlyContinue
Write-Host "✓ 捷徑已刪除" -ForegroundColor Green

# 3. 清理註冊表
Write-Host "`n[3/4] 清理註冊表..." -ForegroundColor Yellow
Remove-Item "HKCU:\Software\geniideas-vue" -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" -ErrorAction SilentlyContinue | 
    Where-Object { $_.GetValue("DisplayName") -like "*Geniideas*" } | 
    ForEach-Object { Remove-Item $_.PSPath -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host "✓ 註冊表已清理" -ForegroundColor Green

# 4. 詢問是否刪除用戶數據
Write-Host "`n[4/4] 用戶數據處理..." -ForegroundColor Yellow
$dataPath = "$env:APPDATA\geniideas-vue"
if (Test-Path $dataPath) {
    $response = Read-Host "是否刪除用戶數據? (包含所有專案) [y/N]"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-Item $dataPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✓ 用戶數據已刪除" -ForegroundColor Green
    } else {
        Write-Host "✓ 用戶數據已保留在: $dataPath" -ForegroundColor Green
    }
} else {
    Write-Host "✓ 未找到用戶數據" -ForegroundColor Green
}

Write-Host "`n清理完成! 現在可以重新安裝應用程式。" -ForegroundColor Cyan
Write-Host "按任意鍵退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
```

**使用方法**:
1. 將上述內容保存為 `cleanup.ps1`
2. 右鍵點擊文件 → 選擇「以 PowerShell 執行」
3. 如果提示執行策略,執行:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

---

## 🔄 重新安裝步驟

清理完成後:

### **步驟 1: 重新打包** (在開發機器上)

```bash
# 清理舊的構建
rm -rf dist release

# 重新構建
ELECTRON=true npm run build

# 重新打包
npm run electron:build:win
```

新的安裝程式會命名為:
```
Geniideas Flowchart-Setup-1.0.0.exe
```

### **步驟 2: 驗證安裝程式**

在 Windows 上安裝前,檢查文件:
1. 右鍵點擊安裝程式
2. 選擇「內容」
3. 查看「數位簽章」標籤 (如果有)
4. 確認文件大小合理 (約 150-200 MB)

### **步驟 3: 安裝**

1. 雙擊新的安裝程式
2. 選擇安裝位置
3. 完成安裝
4. 啟動應用測試

---

## ✅ 驗證安裝

安裝完成後:

### 1. 檢查文件
```
C:\Program Files\Geniideas Flowchart\
├── Geniideas Flowchart.exe
├── resources\
│   ├── app.asar
│   └── app.asar.unpacked\
└── Uninstall Geniideas Flowchart.exe  ← 卸載程式
```

### 2. 檢查日誌
```
C:\Users\[您的用戶名]\AppData\Roaming\geniideas-vue\logs\
```

### 3. 測試功能
- [ ] 應用可以啟動
- [ ] 可以創建專案
- [ ] 可以儲存專案
- [ ] 可以匯出 Excel

---

## 🛡️ 預防措施

### 避免未來出現此問題:

1. **使用穩定的打包環境**
   - 確保網路穩定
   - 確保硬碟空間充足

2. **驗證打包結果**
   - 檢查文件大小
   - 在虛擬機中測試安裝

3. **保留舊版本**
   - 打包新版本前,保留上一個可用版本

4. **使用版本號**
   - 每次打包更新版本號
   - 方便追蹤和管理

---

## 📞 需要幫助?

如果清理後仍有問題:

1. **檢查權限**: 確保以管理員身份執行
2. **重啟電腦**: 清理後重啟
3. **檢查防毒軟體**: 暫時停用防毒軟體
4. **查看日誌**: 檢查錯誤訊息

---

**更新日期**: 2025-11-24  
**適用版本**: 1.0.0+
