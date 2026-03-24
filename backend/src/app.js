/**
 * 闪电下载器 - 后端入口
 * 复制自小电驴架构，支持抖音、Twitter/X等多平台下载
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRouter = require('./routes/api');

// 下载目录
const DOWNLOAD_DIR = path.join(__dirname, '../../downloads');

// 确保下载目录存在
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api', apiRouter);

// 静态提供下载文件
app.use('/download', express.static(DOWNLOAD_DIR));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 0,
    data: {
      status: 'ok',
      version: '1.0.0',
      platform: '闪电下载器',
      timestamp: new Date().toISOString()
    }
  });
});

// 前端静态文件 (生产环境)
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 启动
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ 闪电下载器后端启动成功`);
  console.log(`   http://0.0.0.0:${PORT}`);
  console.log(`   API: http://0.0.0.0:${PORT}/api`);
  console.log(`   下载目录: ${DOWNLOAD_DIR}`);
});

module.exports = app;
