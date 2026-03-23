# 🚂 Railway 部署指南

## 快速部署（3分钟）

### 1. 准备代码

确保项目结构完整：
```
shandian/
├── backend/          # Node.js API
├── frontend/         # React 前端  
├── railway.toml      # Railway 配置 ✅
└── nixpacks.toml    # 构建配置 ✅
```

### 2. 创建 Railway 项目

1. 访问 https://railway.app
2. 点击 **"New Project"**
3. 选择 **"Deploy from GitHub repo"**
4. 授权并选择你的代码仓库

### 3. 配置环境变量

在 Railway 项目面板 → **Variables** 中添加：

```
NODE_ENV = production
PORT = 3001
```

### 4. 部署

Railway 会自动检测 `railway.toml` 并部署：

- **构建**: 自动安装依赖 + 编译 TypeScript
- **启动**: 运行 `npm start` 启动后端
- **前端**: 静态文件自动部署

### 5. 获取域名

部署完成后：

1. 进入项目 → **Settings** → **Domains**
2. 点击 **Generate Domain**
3. 获得 `https://your-app.railway.app`

**手机访问这个链接即可！**

---

## 🔧 常见问题

### Q: 部署失败/超时？

A: Railway 免费版限制：
- 构建时间 10 分钟
- 内存 512MB
- 磁盘 1GB

**解决**: 升级到 Hobby 计划 ($5/月) 或使用 VPS

### Q: 下载大视频超时？

A: Railway HTTP 请求 100 秒超时限制。

**解决**: 
1. 使用 WebSocket 实时推送进度
2. 或改用 VPS 部署

### Q: 自定义域名？

A: Settings → Domains → Custom Domain
添加你的域名并配置 DNS

---

## 💡 替代方案

如果 Railway 不满足需求：

| 平台 | 优点 | 缺点 |
|------|------|------|
| **Vercel** | 前端极速部署 | 无后端长任务 |
| **Netlify** | 简单易用 | 函数超时 10s |
| **Fly.io** |  Docker 自由 | 需信用卡 |
| **VPS 阿里云** | 完全控制 | 需自行维护 |

---

**有问题随时问我！** 🚀
