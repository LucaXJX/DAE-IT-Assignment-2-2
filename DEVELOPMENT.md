# 開發說明文件

## 🎉 專案結構（已重構）

```
DAE-IT-Assignment-4/
├── src/                      # TypeScript 源代碼
│   ├── types.ts             # 類型定義
│   ├── zhconvert.ts         # 繁化姬 API 服務
│   ├── api.ts               # 後端 API 服務層
│   ├── data.ts              # 本地景點資料
│   ├── main.ts              # 前端邏輯（TypeScript）
│   └── server.ts            # Express 服務器（TypeScript）✨ 新增
├── public/                   # 靜態文件資料夾 ✨ 新增
│   ├── index.html           # 主頁面
│   └── img/                 # 圖片資源
├── dist/                     # 編譯後的 JavaScript
│   ├── main.js              # 前端編譯代碼
│   ├── server.js            # 服務器編譯代碼
│   └── *.map                # Source maps
├── docs/                     # API 使用範例等文檔
├── package.json             # 專案配置
├── tsconfig.json            # TypeScript 配置
└── .prettierrc              # 代碼格式化配置
```

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 編譯 TypeScript
```bash
npm run build
```
這會同時編譯前端 (`src/main.ts`) 和後端 (`src/server.ts`)

### 3. 啟動服務器
```bash
npm start
```
瀏覽器訪問：http://localhost:8080

## 📝 可用指令

| 指令 | 說明 |
|------|------|
| `npm run build` | 編譯前端和後端 TypeScript |
| `npm run build:client` | 只編譯前端代碼 |
| `npm run build:server` | 只編譯服務器代碼 |
| `npm run watch:client` | 自動監聽並編譯前端代碼 |
| `npm run watch:server` | 自動監聽並編譯服務器代碼 |
| `npm start` | 啟動 Express 服務器 |
| `npm run dev` | 啟動服務器（nodemon 自動重啟） |

## 🛠️ 開發工作流程

### 方案 1：基本開發（最簡單）
```bash
npm run build      # 編譯前端和後端
npm start          # 啟動服務器
```

### 方案 2：自動編譯前端（推薦）
```bash
# 一次性編譯後端
npm run build:server

# 終端 1：自動編譯前端
npm run watch:client

# 終端 2：啟動服務器
npm run dev
```

### 方案 3：完全自動（需要 3 個終端）
```bash
# 終端 1
npm run watch:client

# 終端 2
npm run watch:server

# 終端 3
npm run dev
```

## 🌟 已完成的重構

### ✅ 專案結構優化
- [x] 創建 `public/` 資料夾存放靜態文件
- [x] 移動 `index.html` 到 `public/`
- [x] 移動 `img/` 資料夾到 `public/img/`
- [x] 將 `server.js` 改為 TypeScript (`src/server.ts`)

### ✅ TypeScript 全棧化
- [x] 前端代碼：`src/main.ts`
- [x] 後端代碼：`src/server.ts`
- [x] 完整的類型定義

### ✅ 編譯系統
- [x] 使用 esbuild 快速編譯
- [x] 支援獨立編譯前端/後端
- [x] Source maps 支援

## 🛠️ 技術棧

### 前端
- TypeScript
- Ionic Framework (CDN)
- Chart.js
- 繁化姬 API

### 後端
- TypeScript
- Express
- esbuild (編譯)
- nodemon (開發工具)

### API
- REST API: `https://dae-mobile-assignment.hkit.cc/api`
- 主題：公眾景點 (`/attractions`)

## 📦 依賴說明

### 生產依賴
- `express` - Web 服務器

### 開發依賴
- `typescript` - TypeScript 編譯器
- `@types/express` - Express 類型定義
- `@types/node` - Node.js 類型定義
- `esbuild` - 快速編譯工具
- `nodemon` - 自動重啟服務器
- `prettier` - 代碼格式化

## 🐛 常見問題

### Q: 頁面顯示空白？
A: 確保已編譯前端代碼：`npm run build:client`

### Q: 服務器無法啟動？
A: 確保已編譯服務器代碼：`npm run build:server`

### Q: 修改代碼後沒有更新？
A: 使用 `npm run watch:client` 自動編譯，並清除瀏覽器緩存（Ctrl+Shift+R）

### Q: 端口被佔用？
A: 設置環境變數：`PORT=3000 npm start`

## 📚 下一步計劃

- [ ] 整合 API 資料顯示
- [ ] 實作載入狀態
- [ ] 實作錯誤處理 UI
- [ ] 實作分頁功能
- [ ] 實作使用者認證
- [ ] 實作收藏功能

## 🔗 相關資源

- [TypeScript 官方文檔](https://www.typescriptlang.org/)
- [Express 官方文檔](https://expressjs.com/)
- [繁化姬 API 文檔](https://docs.zhconvert.org/)
- [Ionic Framework](https://ionicframework.com/)

