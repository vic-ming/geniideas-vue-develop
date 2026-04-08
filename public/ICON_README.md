# 應用圖標說明

## 需要的圖標文件

為了完整打包 Windows 應用程式,您需要準備以下圖標文件:

### Windows 圖標
- **檔案名稱**: `icon.ico`
- **位置**: `/public/icon.ico`
- **格式**: ICO 格式
- **建議尺寸**: 256x256 像素 (包含多個尺寸: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256)

### PNG 圖標 (可選,用於開發)
- **檔案名稱**: `icon.png`
- **位置**: `/public/icon.png`
- **格式**: PNG 格式
- **建議尺寸**: 512x512 像素

## 如何創建圖標

### 方法 1: 使用線上工具
1. 訪問 https://www.icoconverter.com/
2. 上傳您的 PNG 圖片 (建議 512x512)
3. 選擇生成多尺寸 ICO 文件
4. 下載並重命名為 `icon.ico`
5. 放置到 `/public/` 目錄

### 方法 2: 使用 ImageMagick (命令行)
```bash
# 安裝 ImageMagick
brew install imagemagick  # macOS
# 或
choco install imagemagick  # Windows

# 轉換 PNG 為 ICO
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### 方法 3: 使用 Photoshop/GIMP
1. 創建 256x256 的圖片
2. 使用 ICO 插件導出為 .ico 格式
3. 確保包含多個尺寸

## 臨時解決方案

如果暫時沒有圖標,可以:
1. 使用默認的 Electron 圖標 (打包時會有警告但不影響功能)
2. 或者從 `package.json` 中移除 `"icon": "public/icon.ico"` 這一行

## 圖標設計建議

- 使用簡潔的設計,在小尺寸下也能清晰辨識
- 使用品牌顏色
- 避免過多細節
- 確保在深色和淺色背景下都清晰可見
- 建議使用透明背景

## 當前狀態

⚠️ **需要添加圖標文件**

請在打包前添加 `icon.ico` 文件到 `/public/` 目錄,或者修改 `package.json` 中的圖標配置。
