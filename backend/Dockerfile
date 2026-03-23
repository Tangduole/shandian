FROM node:20-slim

# 系统依赖 + yt-dlp
RUN apt-get update && apt-get install -y python3 ffmpeg curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# 后端代码
COPY package.json ./
COPY tsconfig.json ./
COPY src/ src/

RUN npm install && npm run build

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/index.js"]
