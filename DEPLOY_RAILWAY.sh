#!/bin/bash
# 🚂 Railway 一键部署脚本
# 使用方法：
# 1. 保存为 deploy.sh
# 2. chmod +x deploy.sh
# 3. ./deploy.sh

echo "🚀 开始 Railway 部署流程..."
echo ""

# 检查目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    echo "正确做法: cd ~/projects/shandian && bash DEPLOY_RAILWAY.sh"
    exit 1
fi

echo "✅ 步骤 1/5: 检查 Git 配置..."
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "   初始化 Git 仓库..."
    git init
fi

echo "✅ 步骤 2/5: 提交代码..."
git add .
git commit -m "Prepare for Railway deployment" || echo "   无更改需要提交"

echo ""
echo "✅ 步骤 3/5: 检查 GitHub 远程仓库..."
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "   ⚠️  请先创建 GitHub 仓库并关联:"
    echo "      1. 访问 https://github.com/new"
    echo "      2. Repository name: shandian"
    echo "      3. 点击 Create repository"
    echo "      4. 复制页面上的 'push an existing repository' 命令并执行"
    exit 1
fi

echo "   推送代码到 GitHub..."
git push origin main || git push origin master

echo ""
echo "✅ 步骤 4/5: Railway 部署..."
echo "   请手动完成以下步骤:"
echo ""
echo "   1. 打开浏览器访问: https://railway.app"
echo "   2. 点击 'Login with GitHub' 登录"
echo "   3. 点击 'New Project' → 'Deploy from GitHub repo'"
echo "   4. 选择 'shandian' 仓库"
echo "   5. 点击 'Deploy' 等待部署完成"
echo ""

echo "✅ 步骤 5/5: 获取外网链接..."
echo "   部署完成后:"
echo "   1. 点击部署卡片上的链接"
echo "   2. 或使用自动生成的域名"
echo "   3. 格式: https://xxx.up.railway.app"
echo ""

echo "🎉 完成！手机访问 Railway 给的链接即可使用！"
echo ""
echo "💡 提示:"
echo "   - 首次访问可能需要 10-30 秒唤醒服务"
echo "   - 免费版 30 分钟无访问会休眠，再次访问自动唤醒"
echo "   - 如需 24 小时在线，建议升级 Hobby 计划 ($5/月)"
