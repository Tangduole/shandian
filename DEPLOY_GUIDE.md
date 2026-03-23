# 🚀 Railway 部署指南（手机外网访问）

> 目标：获得永久免费的外网链接，手机随时访问

---

## 📋 准备工作（回家前完成）

### 1. 注册账号

| 平台 | 用途 | 网址 | 备注 |
|------|------|------|------|
| GitHub | 存放代码 | https://github.com/join | 已有可跳过 |
| Railway | 部署服务 | https://railway.app | 用GitHub登录更方便 |

✅ **完成标志**：GitHub 和 Railway 都能登录

---

## 🚀 部署步骤（回家后）

### Step 1: 推送代码到 GitHub（10分钟）

打开终端，执行以下命令：

```bash
# 1. 进入项目目录
cd ~/projects/shandian

# 2. 初始化 Git
git init

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "Initial commit: Video downloader app"

# 5. 在 GitHub 创建仓库（浏览器操作）
# 打开 https://github.com/new
# Repository name 填：shandian
# 点击 "Create repository"

# 6. 关联远程仓库（把下面的 YOUR_USERNAME 换成你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/shandian.git

# 7. 推送到 GitHub
git branch -M main
git push -u origin main
```

✅ **完成标志**：浏览器打开 `https://github.com/YOUR_USERNAME/shandian` 能看到代码

---

### Step 2: Railway 部署（5分钟）

1. **打开 Railway**：https://railway.app

2. **登录**：点击 "Login with GitHub"

3. **创建项目**：
   - 点击紫色按钮 **"New Project"**
   - 选择 **"Deploy from GitHub repo"**
   - 找到并点击 `shandian` 仓库
   - 点击 **"Deploy"**

4. **等待部署**（2-3分钟）
   - Railway 会自动检测 Node.js 项目
   - 自动安装依赖、构建、部署
   - 看到 "Deployed" 绿色标志就是成功

5. **获得外网链接**
   - 点击部署卡片上的链接
   - 格式：`https://shandian-production.up.railway.app`

✅ **完成标志**：浏览器打开链接能看到小电驴界面

---

### Step 3: 手机访问 📱

1. **复制 Railway 给的链接**（上面第5步的）
2. **手机浏览器打开**
3. ✅ **搞定！** 外网可访问！

可以分享给朋友使用：
- 微信发送链接
- 生成二维码扫码
- 收藏书签随时访问

---

## 🛠️ 常见问题

### Q1: 部署失败/Build Error？

**检查 package.json 是否有这些脚本：**

```json
{
  "scripts": {
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm install && npm run build",
    "build:backend": "cd backend && npm install && npm run build",
    "start": "cd backend && npm start"
  }
}
```

### Q2: 链接打不开/显示 "Not Found"？

可能原因：
- 服务休眠了（免费版30分钟无访问会休眠）
- 首次访问等 10-30 秒唤醒
- 检查 Railway 后台状态是否为 "Healthy"

### Q3: 想换自定义域名？

Railway 支持自定义域名：
1. Settings → Domains
2. Add Custom Domain
3. 输入你的域名（如 `dl.yourdomain.com`）
4. 按提示配置 DNS CNAME 记录
5. 需要绑定信用卡（验证用，不扣费）

### Q4: 视频下载超时？

Railway 免费版 HTTP 请求 100 秒超时限制。

**解决方案：**
1. 改用 WebSocket 推送进度
2. 改用 VPS 部署（无超时限制）
3. 分段下载小文件

---

## 📱 保存这个流程

```
回家 → 开电脑 → 执行 Step 1 & 2 → 获得外网链接 → 手机访问
```

**有任何问题随时问我！** 🚀

祝部署顺利！🎉