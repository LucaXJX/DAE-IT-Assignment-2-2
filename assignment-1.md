手機應用程式開發導論

# 習作一： 可搜尋清單 (手機網頁界面)

此習作佔本科目總分的 **15%**。

**提交日期：2025-10-12**

## 習作簡介

本習作旨在讓學生熟悉 Ionic Framework 的基本使用，並實作一個具備搜尋功能的清單應用程式。學生將學習如何使用 Ionic UI 元件、處理使用者輸入，以及建立響應式使用者介面。

### 學習目標

- 使用 **Ionic CDN** 建立網頁應用程式
- 使用 **Ionic UI 元件**建立使用者介面
- 實作 **事件處理** 和 **DOM 操作**
- 掌握 **JavaScript** 在網頁應用中的應用
- 理解 **響應式設計** 原則

## 主題分配

每位學生會被分配到一個清單主題，根據學生 ID 除以 10 的餘數決定。例如，如果學生 ID 是 28361933：

1. 計算 28361933 mod 10 得到 3
2. 學生會被分配到主題 3 的清單應用

以下是十個主題：

1. 程式教學：課程名稱、程式語言、程度、重點、課程封面、教學影片
2. 運動教學：運動名稱、難度、所需時間、器材、示範圖片、教學影片
3. 瑜伽動作：動作名稱、難度、效果、注意事項、示範圖片、教學影片
4. 開源軟體：名稱、版本、授權條款、用途、軟體圖示、示範影片
5. 開源硬體：產品名稱、類型、功能、特點、產品圖片、示範影片
6. 免費字體：字體名稱、設計師、風格、使用場景、字體範例圖、展示影片
7. 古典音樂：曲目名稱、作曲家、年代、風格、封面圖片、演奏影片
8. 維基百科：條目名稱、主題、語言、摘要、主題圖片、相關影片
9. 公眾景點：地點名稱、地區、開放時間、特色、景點照片、導覽影片
10. 寵物品種：品種名稱、體型、特性、照顧重點、寵物圖片、介紹影片

注意：

- 每個項目必須包含一張圖片和一個影片
- 圖片檔案大小不可超過 300 KB
- 圖片尺寸不超過 800x800 像素
- 影片可選擇：
  1. 嵌入 YouTube 影片
  2. 使用 HTML5 原生 video 元素（檔案大小不超過 5MB）
- 所有媒體內容必須注意版權問題，建議使用免費資源

---

## 習作要求

### 功能需求

1. **清單顯示**

   - 顯示至少 20 個項目
   - 每個項目必須包含所有 6 個資料欄位（依據主題）：
     - 4 個文字欄位（如：名稱、類型、描述等）
     - 1 張圖片
     - 1 個影片
   - 使用 `ion-list` 和 `ion-item` 元件
   - 適當的視覺層級展示資訊
   - 圖片和影片的適當呈現方式

2. **搜尋功能**

   - 實作即時搜尋
   - 支援主標題和描述的關鍵字搜尋
   - 使用 `ion-searchbar` 元件
   - 搜尋結果即時更新

3. **分類功能**

   - 使用 `ion-select` 實作分類過濾
   - 點擊項目的類別標籤可快速過濾
   - 至少包含 3 種不同分類
   - 支援重設分類選項

### 技術要求

- 使用 **Ionic CDN** 版本開發
- 使用 **JavaScript ES6+** 撰寫程式碼
- 實作適當的資料結構

### 資料結構

根據主題使用相應的資料結構，例如程式教學：

```javascript
const items = [
  {
    title: 'Python 基礎入門', // 主標題
    language: 'Python 3', // 程式語言
    level: '入門', // 程度
    details:
      '從零開始學習 Python 程式設計，包含變數、流程控制、函式等基礎概念。', // 重點
    category: '程式入門', // 分類
    tags: ['Python', '程式設計', '入門課程'], // 標籤陣列
    imageUrl: 'images/python-basics.jpg', // 課程封面圖
    videoUrl: 'videos/python-intro.mp4', // 教學影片（本地檔案或 YouTube ID）
  },
  // ... 更多課程資料
]
```

### 基本 HTML 結構

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>主題清單</title>
    <!-- Ionic CDN -->
    <script
      type="module"
      src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js"
    ></script>
    <script
      nomodule
      src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js"
    ></script>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css"
    />
    <style>
      .item-content {
        width: 100%;
      }
      .item-title {
        font-weight: bold;
        margin: 0.25rem 0;
      }
      .item-subtitle {
        color: var(--ion-color-medium);
        font-size: 0.9em;
      }
      .tag-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
    </style>
  </head>
  <body>
    <ion-app>
      <ion-header>
        <ion-toolbar>
          <ion-title>主題清單</ion-title>
        </ion-toolbar>
        <ion-searchbar placeholder="搜尋..."></ion-searchbar>
        <ion-item>
          <ion-select label="分類" interface="popover">
            <ion-select-option value="">全部</ion-select-option>
            <!-- 根據主題加入分類選項 -->
          </ion-select>
        </ion-item>
      </ion-header>

      <ion-content>
        <ion-list>
          <!-- 清單項目範本 -->
          <ion-item class="list-item">
            <div class="item-content">
              <div class="item-title">標題</div>
              <div class="item-subtitle">副標題</div>
              <div class="item-details">詳細資訊</div>
              <div class="tag-container">
                <ion-chip size="small">分類</ion-chip>
                <!-- 標籤 -->
              </div>
            </div>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-app>
  </body>
</html>
```

### 必要功能實作

1. **資料管理**

   ```javascript
   // 初始化資料
   let items = [
     /* 至少 20 筆資料 */
   ]

   // 更新清單顯示
   function updateList() {
     const list = document.querySelector('ion-list')
     const template = document.querySelector('.list-item')
     list.textContent = ''

     // 根據搜尋和過濾條件更新清單
     // ...
   }
   ```

2. **搜尋功能**

   ```javascript
   const searchbar = document.querySelector('ion-searchbar')
   searchbar.addEventListener('ionInput', event => {
     // 實作搜尋邏輯
     updateList()
   })
   ```

3. **分類過濾**

   ```javascript
   const categorySelect = document.querySelector('ion-select')
   categorySelect.addEventListener('ionChange', event => {
     // 實作分類過濾邏輯
     updateList()
   })
   ```

---

## 評分標準（總分 100 分）

1. **基本功能實現（40 分）**

   - 清單顯示（15 分）：

     - 顯示所需欄位（6 分）
       - 4 個文字欄位（3 分）
       - 圖片正確顯示（2 分）
       - 影片正確播放（1 分）
     - 資料完整性（6 分）
       - 至少 20 個項目（3 分）
       - 資料合理且有意義（3 分）
     - 版面配置合理（3 分）

   - 搜尋功能（15 分）：

     - 關鍵字搜尋（8 分）
       - 空白關鍵字顯示所有項目（2 分）
       - 單一關鍵字可正確過濾（4 分）
       - 大小寫不敏感（2 分）
     - 即時更新（4 分）
     - 使用體驗流暢（3 分）

   - 分類功能（10 分）：

     - 選擇類別（4 分）
       - 使用 ion-select（2 分）
       - 點擊標籤可切換分類（2 分）
     - 分類過濾（4 分）
       - 未選擇時顯示所有項目（2 分）
       - 選擇後正確過濾項目（2 分）
     - 搜尋和分類組合使用（2 分）

2. **界面設計（30 分）**

   - 響應式設計（15 分）：

     - 小型螢幕（5 分）
       - 內容不會擠壓
       - 不需橫向捲動
     - 中型螢幕（5 分）
       - 最佳化的預設版面
     - 大型螢幕（5 分）
       - 合理運用空間

   - 視覺設計（15 分）：
     - 介面美觀（8 分）
       - 合理的間距和配色（4 分）
       - 一致的設計風格（4 分）
     - 操作流暢（7 分）
       - 清晰的視覺回饋（4 分）
       - 順暢的動畫效果（3 分）

3. **技術實現（30 分）**

   - 程式碼品質（15 分）：
     - 代碼結構（8 分）
       - 模組化設計（4 分）
       - 命名規範（2 分）
       - 註解完整（2 分）
     - 可維護性（7 分）
       - 代碼重用（4 分）
       - 錯誤處理（3 分）
   - Ionic 運用（15 分）：
     - UI 元件使用（8 分）
       - 正確使用 Ionic 元件（5 分）
       - 元件組合得當（3 分）
     - JavaScript 實作（7 分）
       - 事件處理（4 分）
       - DOM 操作（3 分）

### 響應式設計參考尺寸

| 裝置類型 | 機型              | 螢幕尺寸 |
| -------- | ----------------- | -------- |
| 小型     | iPhone 5          | 320x568  |
| 中型     | iPhone 6/7/8      | 375x667  |
| 中型     | Galaxy S5         | 360x640  |
| 大型     | Galaxy Note       | 412x883  |
| 大型     | iPhone 12 Pro Max | 428x926  |

---

### 額外加分項目 (總共最多 36 分)

1. **資料過濾與排序** (總共最多 13 分)

   - 支援多個分類同時選擇（3 分）
   - 加入日期範圍過濾（3 分）
   - 支援標籤過濾（2 分）
   - 依照不同欄位排序（3 分）
   - 支援升冪/降冪切換（2 分）

2. **介面優化** (總共最多 14 分)

   - 使用 `ion-card` 的卡片視圖（3 分）
   - 支援列表/網格視圖切換（3 分）
   - 加入簡單的統計圖表（3 分）
   - 加入載入動畫效果（3 分）
   - 加入頁面切換動畫（2 分）

3. **功能擴展** (總共最多 9 分)

   - 使用 LocalStorage 保存過濾設定（3 分）
   - 支援收藏功能（3 分）
   - 實作進階搜尋選項（3 分）

注意：

- 每個功能都會根據完成度給予相應分數
- 鼓勵學生嘗試更多進階功能
- 實作品質也會影響加分的評分

## 建議使用工具與資源

**開發工具**

- Visual Studio Code
- Firefox / Chrome DevTools

**推薦外掛**

- Live Server
- Prettier
- Auto Close Tag
- Auto Rename Tag

**參考資源**

- [Ionic Framework 文件](https://ionicframework.com/docs)
- [Ionic UI 元件](https://ionicframework.com/docs/components)
- [MDN Web Docs](https://developer.mozilla.org/zh-TW/)

---

## 提交要求

1. **GitHub 儲存庫**，包含：

   - 完整的原始碼
   - README.md（包含功能完成度自評表）
   - .gitignore 設定

2. **專案文件**，包含：

   - 功能操作說明
   - 測試報告
   - 遇到的問題和解決方法

3. **實機展示影片**

   - 展示所有功能操作（包含已完成的額外加分項目）
   - 展示響應式設計
   - 長度 3-5 分鐘
   - 建議依照評分標準的順序展示功能

4. **不要包含**：
   - node_modules/
   - platforms/
   - www/
   - .sourcemaps/

### README.md 格式

```markdown
# 可搜尋清單 (手機網頁界面)

## 學生資料

- 姓名：
- 學號：
- 主題編號：
- 主題名稱：

## 功能完成度自評

（依照評分標準勾選完成的項目）

### 基本功能（40 分）

- 清單顯示

  - 顯示所需欄位
    - [ ] 4 個文字欄位（3 分）
    - [ ] 圖片正確顯示（2 分）
    - [ ] 影片正確播放（1 分）
  - 資料完整性
    - [ ] 至少 20 個項目（3 分）
    - [ ] 資料合理且有意義（3 分）
  - [ ] 版面配置合理（3 分）

- 搜尋功能

  - 關鍵字搜尋
    - [ ] 空白關鍵字顯示所有項目（2 分）
    - [ ] 單一關鍵字可正確過濾（4 分）
    - [ ] 大小寫不敏感（2 分）
  - [ ] 即時更新（4 分）
  - [ ] 使用體驗流暢（3 分）

- 分類功能
  - 選擇類別
    - [ ] 使用 ion-select（2 分）
    - [ ] 點擊標籤可切換分類（2 分）
  - 分類過濾
    - [ ] 未選擇時顯示所有項目（2 分）
    - [ ] 選擇後正確過濾項目（2 分）
  - [ ] 搜尋和分類組合使用（2 分）

### 界面設計（30 分）

- 響應式設計

  - 小型螢幕（5 分）
    - [ ] 內容不會擠壓
    - [ ] 不需橫向捲動
  - 中型螢幕（5 分）
    - [ ] 最佳化的預設版面
  - 大型螢幕（5 分）
    - [ ] 合理運用空間

- 視覺設計
  - 介面美觀
    - [ ] 合理的間距和配色（4 分）
    - [ ] 一致的設計風格（4 分）
  - 操作流暢
    - [ ] 清晰的視覺回饋（4 分）
    - [ ] 順暢的動畫效果（3 分）

### 技術實現（30 分）

- 程式碼品質

  - 代碼結構
    - [ ] 模組化設計（4 分）
    - [ ] 命名規範（2 分）
    - [ ] 註解完整（2 分）
  - 可維護性
    - [ ] 代碼重用（4 分）
    - [ ] 錯誤處理（3 分）

- Ionic 運用
  - UI 元件使用
    - [ ] 正確使用 Ionic 元件（5 分）
    - [ ] 元件組合得當（3 分）
  - JavaScript 實作
    - [ ] 事件處理（4 分）
    - [ ] DOM 操作（3 分）

### 加分項目

1. 資料過濾與排序

   - [ ] 支援多個分類同時選擇（3 分）
   - [ ] 加入日期範圍過濾（3 分）
   - [ ] 支援標籤過濾（2 分）
   - [ ] 依照不同欄位排序（3 分）
   - [ ] 支援升冪/降冪切換（2 分）

2. 介面優化

   - [ ] 使用卡片視圖（3 分）
   - [ ] 支援列表/網格視圖切換（3 分）
   - [ ] 加入簡單的統計圖表（3 分）
   - [ ] 加入載入動畫效果（3 分）
   - [ ] 加入頁面切換動畫（2 分）

3. 功能擴展

   - [ ] 使用 LocalStorage 保存過濾設定（3 分）
   - [ ] 支援收藏功能（3 分）
   - [ ] 實作進階搜尋選項（3 分）
```

---

## 其他說明

1. **程式碼風格**

   - 使用 Prettier 格式化
   - 遵循 JavaScript 標準風格
   - 適當的註解說明

2. **Git 提交規範**

   - 清晰的提交訊息
   - 適當的提交粒度
   - 有意義的分支管理
