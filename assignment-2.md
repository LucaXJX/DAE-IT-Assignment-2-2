手機應用程式開發導論

# 習作二：API 整合與資料同步 (手機網頁應用)

此習作佔本科目總分的 **15%**。

**提交日期：2025-10-19**

## 習作簡介

本習作建基於習作一的清單應用程式界面，進一步加入後端 API 整合功能。學生將學習如何將靜態的前端應用轉變為具備完整資料存取能力的動態應用程式。

### 學習目標

- 理解 **REST API** 設計原則與使用方式
- 掌握 **TypeScript** 在前端專案中的應用
- 實作 **使用者認證** 與 **使用者資料儲存**
- 處理 **非同步資料流** 與 **錯誤處理**
- 建立完整的 **資料互動介面**

## 主題分配

沿用習作一的主題分配方式，每個主題都有對應的 API 端點：

1. 程式教學：`/api/courses`
2. 運動教學：`/api/exercises`
3. 瑜伽動作：`/api/yoga-poses`
4. 開源軟體：`/api/software`
5. 開源硬體：`/api/hardware`
6. 免費字體：`/api/fonts`
7. 古典音樂：`/api/classical-music`
8. 維基百科：`/api/wiki-entries`
9. 公眾景點：`/api/attractions`
10. 寵物品種：`/api/pet-breeds`

## 習作要求

### 基本功能需求

1. **清單功能 (30 分)**

   - 載入主題資料列表 (15 分)
     - 載入狀態顯示 (5 分)
     - 正確顯示資料（5 分）
     - 錯誤處理提示（5 分）
   - 分頁載入（載入更多按鈕）（15 分）
     - 正確載入更多資料（10 分）
     - 錯誤處理提示（5 分）

2. **使用者認證 (35 分)**

   - 註冊功能 (10 分)
   - 登入功能 (10 分)
   - 登出功能 (5 分)
   - 儲存登入狀態 (10 分)

3. **收藏功能 (35 分)**

   - 收藏項目 (10 分)
   - 取消收藏項目 (10 分)
   - 顯示收藏狀態 (10 分)
   - 整合登入用戶的收藏項目 (5 分)

### 加分項目

- 無限捲動 (5 分)
- 搜尋功能 (5 分)
- 分類過濾 (5 分)
- 排序功能 (5 分)
- 資料驗證 (5 分)
- 只顯示已收藏項目 (5 分)

## API 規格

### 基礎端點

```
https://dae-mobile-assignment.hkit.cc/api
```

### API 端點 (API Endpoints)

1. **清單資料**

```typescript
GET /{resource}

查詢參數 (Query Parameters)：
{
  page?: number // 頁碼 (預設: 1)
  limit?: number // 每頁項目數 (預設: 3, 最大: 5)
  search?: string // 搜尋關鍵字
  category?: string // 分類
  sort?: string // 排序欄位
  order?: 'asc' | 'desc' // 排序方向
}

回應內容：
{
  items: {
    id: number
    title: string
    description: string
    category: string
    imageUrl: string
    videoUrl: string
  }[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

Endpoint 範例, 以程式教學主題為例：
/api/courses?search=Python&page=1&limit=5&category=程式基礎

資料格式範例, 以程式教學主題為例：
{
  "items": [
    {
      "id": 1,
      "title": "Python 基礎入門",
      "language": "Python",
      "level": "入門",
      "description": "從零開始學習 Python 程式設計",
      "category": "程式入門",
      "imageUrl": "https://example.com/images/python-basics.jpg",
      "videoUrl": "https://www.youtube.com/watch?v=lvH4-4iYjgs"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 10
  }
}

```

2. **使用者認證**

```typescript
POST /auth/signup

請求內容：
{
  username: string
  password: string
}

回應內容：
{
  user_id: number
  token: string
}

POST /auth/login

請求內容：
{
  username: string
  password: string
}

回應內容：
{
  user_id: number
  token: string
}

GET /auth/check

請求頭 (Headers)：
{
  Authorization: string // 包含 token 的授權頭
  // e.g. Authorization: "Bearer 1234567890"
}

回應內容：
{
  user_id: number | null
}
```

3. **收藏功能**

```typescript
POST /bookmarks/{item_id}

請求頭 (Headers): Authorization

回應內容：
{
  message: 'newly bookmarked' | 'already bookmarked'
}

DELETE /bookmarks/{item_id}

請求頭 (Headers): Authorization

回應內容：
{
  message: 'newly deleted' | 'already deleted'
}

GET /bookmarks

請求頭 (Headers): Authorization

回應內容：
{
  item_ids: number[];
}
```

### 錯誤回應

HTTP 狀態碼：

- 400: 無效的請求
- 401: 未授權
- 403: 禁止訪問
- 404: 找不到資源
- 500: 伺服器錯誤

```typescript
回應內容：
{
  error: string
}
```

### 示範調用需要身份驗證的 API

```typescript
let baseUrl = 'https://example.com/api'
let token = '123456'
let res = await fetch(`${baseUrl}/bookmarks`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${token}` },
})
let json = await res.json()
console.log(json.item_ids)
```

## 提交要求

1. **GitHub 儲存庫**，包含：

   - 完整的原始碼
   - README.md（包含功能完成度自評表）
   - .gitignore 設定

2. **不要包含**：
   - node_modules/
   - dist/
   - .DS_Store

### README.md 格式

```markdown
# 習作二：API 整合與資料同步 (手機網頁應用)

## 學生資料

- 姓名：
- 學號：
- 主題編號：
- 主題名稱：

## 功能完成度自評

（依照評分標準勾選完成的項目）

### 清單功能（30 分）

- 載入主題資料列表
  - [ ] 載入狀態顯示（5 分）
  - [ ] 正確顯示資料（5 分）
  - [ ] 錯誤處理提示（5 分）
- 分頁載入
  - [ ] 正確載入更多資料（10 分）
  - [ ] 錯誤處理提示（5 分）

### 使用者認證（35 分）

- [ ] 註冊功能（10 分）
- [ ] 登入功能（10 分）
- [ ] 登出功能（5 分）
- [ ] 儲存登入狀態（10 分）

### 收藏功能（35 分）

- [ ] 收藏項目（10 分）
- [ ] 取消收藏項目（10 分）
- [ ] 顯示收藏狀態（10 分）
- [ ] 整合登入用戶的收藏項目（5 分）

### 加分項目（最多 30 分）

- [ ] 無限捲動（5 分）
- [ ] 搜尋功能（5 分）
- [ ] 分類過濾（5 分）
- [ ] 排序功能（5 分）
- [ ] 資料驗證（5 分）
- [ ] 只顯示已收藏項目（5 分）
```

## 其他說明

1. **開發工具建議**

   - Visual Studio Code
   - Firefox / Chrome DevTools (Network 面板)
   - Insomnia（API 測試）

2. **開發環境設置**

   - 使用 TypeScript 開發
   - 使用 esbuild 編譯
   - 基於提供的專案骨架開發
   - 遵循專案既有的程式碼風格

3. **程式碼規範**

   - 清晰的檔案組織
   - 使用 Prettier 格式化
   - 遵循 TypeScript 標準風格
   - 適當的程式碼註解

4. **Git 版本控制**
   - 清晰的提交訊息
   - 適當的提交粒度
   - 有意義的分支管理

注意：

- 每個功能都會根據完成度給予相應分數
- 鼓勵學生嘗試功能擴展
- 實作品質也會影響加分的評分
