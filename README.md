# Geniideas Vue

Geniideas 單線圖編輯器 - 使用 Vue.js 和 SQLite 資料庫

## 功能特色

- ✅ Vue 3 組合式 API
- ✅ Vite 建構工具
- ✅ Node.js 後端伺服器
- ✅ SQLite 資料庫
- ✅ 檔案管理（儲存、讀取、另存、刪除）
- ✅ 現代化 UI 設計
- ✅ 響應式設計

## 專案結構

```
geniideas-vue/
├── src/                      # 前端 Vue.js 應用
│   ├── components/          # Vue 組件
│   │   ├── Setting.vue      # 設定面板
│   │   ├── FileManager.vue # 檔案管理器
│   │   ├── Popup.vue       # 彈窗組件
│   │   └── FlowCards/      # 單線圖卡片組件
│   ├── assets/             # 靜態資源
│   ├── App.vue             # 主應用組件
│   ├── main.js             # 應用入口點
│   └── style.css           # 全域樣式
├── server/                  # 後端 Node.js 伺服器
│   ├── db/                # 資料庫檔案
│   │   ├── database.js    # 資料庫設定
│   │   └── flowcharts.db # SQLite 資料庫
│   ├── index.js          # Express 伺服器
│   └── package.json      # 後端依賴
├── index.html             # HTML 模板
├── package.json           # 專案配置
├── vite.config.js        # Vite 配置
└── README.md             # 專案說明
```

## 安裝與啟動

### 1. 安裝前端依賴
```bash
npm install
```

### 2. 安裝後端依賴
```bash
cd server
npm install
cd ..
```

### 3. 啟動後端伺服器
```bash
cd server
npm start
```

### 4. 啟動前端開發伺服器
在另一個終端視窗：
```bash
npm run dev
```

專案將在 `http://localhost:5173` 啟動（前端）
後端 API 在 `http://localhost:3000` 運行

## 功能說明

### 檔案管理
- **儲存檔案**: 將當前單線圖儲存到資料庫
- **另存檔案**: 以新檔名儲存當前單線圖
- **讀取檔案**: 從資料庫讀取並載入已儲存的單線圖
- **刪除檔案**: 刪除資料庫中的舊檔案

### API 端點
詳見 `server/README.md`

## 技術棧

- **Vue 3** - 漸進式 JavaScript 框架
- **Vite** - 快速的前端建構工具
- **Node.js** - 後端運行環境
- **Express** - Web 應用框架
- **SQLite** - 輕量級資料庫
- **JavaScript ES6+** - 現代 JavaScript 語法
- **SCSS** - CSS 預處理器

## 授權

MIT License
