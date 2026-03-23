# 🚂 Railway 完整部署指南

> 目标：获得永久免费的 HTTPS 外网链接，手机随时访问

---

## 📋 部署前检查清单

回家确认以下准备就绪：

- [ ] 电脑已开机
- [ ] 项目代码在 `~/projects/shandian/`
- [ ] GitHub 账号可登录
- [ ] 网络连接正常

---

## 🚀 部署步骤（预计 15 分钟）

### Step 1: 推送代码到 GitHub（3分钟）

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

# 5. 在 GitHub 创建仓库
# 打开浏览器访问: https://github.com/new
# Repository name: shandian
# 点击 "Create repository"

# 6. 关联远程仓库（把下面的 YOUR_USERNAME 换成你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/shandian.git

# 7. 推送代码
git branch -M main
git push -u origin main
```

✅ **检查点**：浏览器访问 `https://github.com/YOUR_USERNAME/shandian` 能看到代码

---

### Step 2: Railway 部署（10分钟）

**2.1 登录 Railway**
1. 打开 https://railway.app
2. 点击 **"Login"** → **"Continue with GitHub"**
3. 授权 Railway 访问你的 GitHub

**2.2 创建项目**
1. 点击紫色按钮 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 在列表中找到 `shandian` 仓库
4. 点击 **"Add"**

**2.3 等待部署**
- Railway 会自动检测 Node.js 项目
- 自动安装依赖、构建、部署
- 等待 2-3 分钟，看到 **"Deployed"** 绿色标志

**2.4 获取外网链接**
1. 点击部署卡片上的链接
2. 格式类似：`https://shandian-production.up.railway.app`
3. **复制这个链接！**

✅ **检查点**：浏览器访问 Railway 给的链接，能看到小电驴界面

---

### Step 3: 手机访问（2分钟）

1. **把 Railway 链接发到微信/QQ**
2. **手机点击链接**
3. ✅ **搞定！手机可以下载视频了！**

---

## 🔧 常见问题解决

### ❌ "Build Failed"

**原因**: 依赖安装失败或构建脚本错误

**解决**:
```bash
# 本地测试构建是否正常
cd ~/projects/shandian/frontend
npm install
npm run build

# 如果本地成功，重新 push
git add .
git commit -m "Fix build"
git push

# 然后在 Railway 点击 "Redeploy"
```

---

### ❌ "Request Timeout" / 下载大视频失败

**原因**: Railway 免费版 HTTP 请求 100 秒超时

**解决**: **这是 Railway 免费版的硬性限制，无法突破**

**替代方案**:
1. **升级 Railway** → Hobby 计划 ($5/月)，无超时限制
2. **改用 VPS** → 阿里云/腾讯云轻量服务器，无限制
3. **分段下载** → 改代码支持分段下载小文件

---

### ❌ "Cannot find module"

**原因**: 依赖未正确安装

**解决**:
```bash
# 删除重装
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ 域名打不开 / 404

**原因**: 
- 服务休眠了（免费版30分钟无访问会休眠）
- 首次访问需要等待唤醒（10-30秒）

**解决**:
- 等待 10-30 秒后刷新
- 或访问 Railway 后台点击 "Restart"

---

## 🎉 部署成功后的维护

### 日常更新代码

```bash
# 修改代码后...
git add .
git commit -m "Update: xxx"
git push

# Railway 会自动重新部署！
```

### 查看日志

Railway 后台 → 项目 → Deployments → 点击最新部署 → Logs

### 重启服务

Railway 后台 → 项目 → 右上角 "Restart"

---

## 💡 最终建议

| 需求 | 推荐方案 |
|------|----------|
| **临时演示** | ngrok（5分钟搞定，用完关）|
| **个人长期使用** | Railway Hobby（$5/月）或 VPS |
| **多人共享/生产** | VPS（阿里云/腾讯云轻量）|

**如果 Railway 部署遇到问题，随时找我！** 🚀
