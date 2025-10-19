/**
 * Express 開發服務器
 * 用於本地開發和測試
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// 設置靜態文件目錄
app.use(express.static(__dirname));

// 設置 CORS（允許跨域請求，方便開發）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// 提供 JSON 解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 主頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 處理所有其他路由（SPA 支援）
app.get('*', (req, res) => {
  // 如果請求的是文件（包含副檔名），嘗試提供該文件
  if (path.extname(req.path)) {
    res.sendFile(path.join(__dirname, req.path), (err) => {
      if (err) {
        res.status(404).send('File not found');
      }
    });
  } else {
    // 否則返回 index.html（SPA 路由）
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// 啟動服務器
app.listen(PORT, () => {
  console.log('\n=================================');
  console.log('🚀 Express 開發服務器已啟動！');
  console.log('=================================');
  console.log(`📍 本地地址: http://localhost:${PORT}`);
  console.log(`📁 根目錄: ${__dirname}`);
  console.log('=================================');
  console.log('\n按 Ctrl+C 停止服務器\n');
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n\n👋 正在關閉服務器...');
  process.exit(0);
});

