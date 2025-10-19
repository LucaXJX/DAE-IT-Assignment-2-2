/**
 * Express 開發服務器 (TypeScript)
 * 用於本地開發和測試
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module 中獲取 __dirname 的替代方案
const __dirname = process.cwd();

const app = express();
const PORT = process.env.PORT || 8080;

// 設置靜態文件目錄（public 資料夾）
app.use(express.static(path.join(__dirname, 'public')));

// 設置 dist 資料夾為靜態文件目錄（用於編譯後的 JS）
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// 設置 CORS（允許跨域請求，方便開發）
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
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
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 健康檢查端點
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
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
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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

