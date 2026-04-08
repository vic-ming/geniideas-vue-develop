@echo off
chcp 65001 >nul
echo ========================================
echo Geniideas Flowchart 完全清理工具
echo ========================================
echo.
echo 此工具將完全移除 Geniideas Flowchart
echo 包括程式文件、捷徑和註冊表項目
echo.
echo 警告: 此操作無法撤銷!
echo.
pause

echo.
echo [1/4] 檢查管理員權限...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✓ 已獲得管理員權限
) else (
    echo ✗ 需要管理員權限!
    echo 請右鍵點擊此文件,選擇「以系統管理員身分執行」
    pause
    exit /b 1
)

echo.
echo [2/4] 刪除程式文件...
if exist "C:\Program Files\Geniideas Flowchart" (
    rmdir /s /q "C:\Program Files\Geniideas Flowchart" 2>nul
    echo ✓ 已刪除 Program Files 中的安裝
) else (
    echo - Program Files 中未找到安裝
)

if exist "%LOCALAPPDATA%\Programs\Geniideas Flowchart" (
    rmdir /s /q "%LOCALAPPDATA%\Programs\Geniideas Flowchart" 2>nul
    echo ✓ 已刪除 AppData\Local 中的安裝
) else (
    echo - AppData\Local 中未找到安裝
)

echo.
echo [3/4] 刪除捷徑...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Geniideas Flowchart.lnk" (
    del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Geniideas Flowchart.lnk" 2>nul
    echo ✓ 已刪除開始菜單捷徑
) else (
    echo - 未找到開始菜單捷徑
)

if exist "%USERPROFILE%\Desktop\Geniideas Flowchart.lnk" (
    del /f /q "%USERPROFILE%\Desktop\Geniideas Flowchart.lnk" 2>nul
    echo ✓ 已刪除桌面捷徑
) else (
    echo - 未找到桌面捷徑
)

echo.
echo [4/4] 處理用戶數據...
if exist "%APPDATA%\geniideas-vue" (
    echo.
    echo 發現用戶數據: %APPDATA%\geniideas-vue
    echo 此資料夾包含您的所有專案和設定
    echo.
    set /p DELETE_DATA="是否刪除用戶數據? (Y/N): "
    if /i "%DELETE_DATA%"=="Y" (
        rmdir /s /q "%APPDATA%\geniideas-vue" 2>nul
        echo ✓ 用戶數據已刪除
    ) else (
        echo ✓ 用戶數據已保留
    )
) else (
    echo - 未找到用戶數據
)

echo.
echo ========================================
echo 清理完成!
echo ========================================
echo.
echo 註冊表項目需要手動清理 (可選):
echo 1. 按 Win + R
echo 2. 輸入 regedit
echo 3. 前往: HKEY_CURRENT_USER\Software\geniideas-vue
echo 4. 刪除該項目
echo.
echo 現在可以重新安裝應用程式。
echo.
pause
