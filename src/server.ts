/**
 * Express 開發服務器 (TypeScript)
 * 用於本地開發和測試
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';

// 使用 process.cwd() 獲取當前工作目錄
const __dirname = process.cwd();

const app = express();
const PORT = process.env.PORT || 8080;

// 設置靜態文件目錄（public 資料夾）
app.use(express.static(path.join(__dirname, 'public')));

// 設置 dist 資料夾為靜態文件目錄（用於編譯後的 JS）
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// 設置 CORS（允許跨域請求，方便開發）
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

// 提供 JSON 解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 主頁路由
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 健康檢查端點
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * 延遲函數（用於重試）
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 帶重試的 fetch 請求
 */
async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        // 5xx 錯誤才重試，4xx 錯誤直接拋出
        if (response.status >= 500 && attempt < maxRetries) {
          throw new Error(`API 返回 ${response.status}，將重試`);
        }
        throw new Error(`API 請求失敗: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delayTime = Math.min(500 * Math.pow(2, attempt), 5000);
        console.log(
          `  ⚠️ 第 ${attempt + 1} 次嘗試失敗，${delayTime}ms 後重試...`
        );
        await delay(delayTime);
      }
    }
  }

  throw lastError;
}

// 圖表數據API端點（用於餅狀圖）
app.get('/api/chart-data', async (_req: Request, res: Response) => {
  try {
    console.log('📊 正在獲取圖表數據...');

    const API_BASE_URL = 'https://dae-mobile-assignment.hkit.cc/api';
    const RESOURCE_ENDPOINT = '/attractions';

    // 獲取所有數據（不限制搜索，獲取足夠多的數據來統計分類）
    // 持續請求直到連續3次沒有新數據
    const allItems: any[] = [];
    const seenIds = new Set<number>(); // 用於檢測重複數據
    let currentPage = 1;
    let consecutiveNoNewData = 0; // 連續沒有新數據的次數
    const maxConsecutiveNoData = 3; // 連續3次沒有新數據就停止
    const limit = 20; // 每頁最多20個
    const maxPages = 50; // 最大頁數限制，避免無限循環

    while (
      consecutiveNoNewData < maxConsecutiveNoData &&
      currentPage <= maxPages
    ) {
      const url = `${API_BASE_URL}${RESOURCE_ENDPOINT}?page=${currentPage}&limit=${limit}`;
      console.log(`  📄 請求第 ${currentPage} 頁...`);

      try {
        // 使用帶重試的請求
        const data = await fetchWithRetry(url, 3);

        if (data.items && data.items.length > 0) {
          // 過濾重複的數據
          let newItemsCount = 0;
          data.items.forEach((item: any) => {
            if (item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              allItems.push(item);
              newItemsCount++;
            }
          });

          console.log(
            `    ✅ 獲取 ${data.items.length} 個項目，新增 ${newItemsCount} 個不重複項目（總計: ${allItems.length}）`
          );

          // 如果這一頁沒有新數據，增加計數器
          if (newItemsCount === 0) {
            consecutiveNoNewData++;
            console.log(
              `    ⚠️ 沒有新數據 (連續 ${consecutiveNoNewData}/${maxConsecutiveNoData} 次)`
            );
          } else {
            // 有新數據，重置計數器
            consecutiveNoNewData = 0;
          }

          currentPage++;
        } else {
          // 返回空數據，增加計數器
          console.log('    返回空數據');
          consecutiveNoNewData++;
          currentPage++;
        }
      } catch (error) {
        console.error(`  ❌ 第 ${currentPage} 頁請求失敗:`, error);

        // 如果前3頁都失敗且沒有數據，拋出錯誤
        if (currentPage <= 3 && allItems.length === 0) {
          throw error;
        }

        // 否則嘗試下一頁
        consecutiveNoNewData++;
        currentPage++;
      }
    }

    if (consecutiveNoNewData >= maxConsecutiveNoData) {
      console.log(`  ✅ 連續 ${maxConsecutiveNoData} 次沒有新數據，停止請求`);
    }
    if (currentPage > maxPages) {
      console.log(`  ⚠️ 達到最大頁數限制 (${maxPages} 頁)`);
    }

    console.log(`✅ 成功獲取 ${allItems.length} 個景點數據`);

    // 統計各分類的數量
    const categoryCount: { [key: string]: number } = {};

    allItems.forEach((item) => {
      const category = item.category || '未分類';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // 轉換為圖表所需的格式
    const categories = Object.keys(categoryCount);
    const chartData = {
      labels: categories,
      data: Object.values(categoryCount),
      total: allItems.length,
      categories: categories, // 新增：分類列表供前端下拉選單使用
    };
    
    console.log('📊 分類統計:', categoryCount);
    console.log('📋 可用分類:', categories);
    
    res.json(chartData);
  } catch (error) {
    console.error('❌ 獲取圖表數據失敗:', error);
    res.status(500).json({
      error: 'Failed to fetch chart data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 處理所有其他路由（SPA 支援）
app.get('*', (req: Request, res: Response) => {
  // 如果請求的是文件（包含副檔名），嘗試提供該文件
  if (path.extname(req.path)) {
    const filePath = path.join(__dirname, 'public', req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).send('File not found');
      }
    });
  } else {
    // 否則返回 index.html（SPA 路由）
    res.sendFile(path.join(__dirname, 'public/index.html'));
  }
});

// 錯誤處理中間件
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log('\n=================================');
  console.log('🚀 Express 開發服務器已啟動！');
  console.log('=================================');
  console.log(`📍 本地地址: http://localhost:${PORT}`);
  console.log(`📁 靜態文件: ${path.join(__dirname, 'public')}`);
  console.log(`📁 根目錄: ${__dirname}`);
  console.log('=================================');
  console.log('\n按 Ctrl+C 停止服務器\n');
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n\n👋 正在關閉服務器...');
  process.exit(0);
});
