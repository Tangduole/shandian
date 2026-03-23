FROM node:20-slim

# 系统依赖 + yt-dlp
RUN apt-get update && apt-get install -y python3 ffmpeg curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# 先复制 .gitignore 防止 COPY . 把 node_modules 带进去
COPY .gitignore ./

# 前端
COPY frontend/package.json frontend/
COPY frontend/tsconfig.json frontend/
COPY frontend/tsconfig.node.json frontend/
COPY frontend/vite.config.ts frontend/
COPY frontend/tailwind.config.js frontend/
COPY frontend/postcss.config.js frontend/
COPY frontend/index.html frontend/
COPY frontend/src/ frontend/src/
COPY frontend/public/ frontend/public/
RUN cd frontend && npm install && npm run build

# 后端
COPY backend/package.json backend/
COPY backend/tsconfig.json backend/
COPY backend/src/ backend/src/
RUN cd backend && npm install && npm run build

# 启动
EXPOSE 3001
CMD ["node", "backend/dist/index.js"]
