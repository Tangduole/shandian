# 闪电下载器 - Dockerfile
FROM node:20-slim

# 安装系统依赖 + yt-dlp
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# 1. 复制根 package.json
COPY package.json ./

# 2. 复制 frontend
COPY frontend/package.json frontend/
RUN cd frontend && npm install

# 3. 复制 backend
COPY backend/package.json backend/
RUN cd backend && npm install

# 4. 复制全部源码
COPY . .

# 5. 构建
RUN npm run build

# 6. 暴露端口
EXPOSE 3001

# 7. 启动
CMD ["npm", "start"]
