# ⚡ 闪电下载器 / Lightning Downloader

多平台视频下载工具，支持 YouTube、TikTok、X/Twitter、抖音、Bilibili。

## Features

- 🎬 Video download (MP4)
- 🎵 Audio extraction (MP3)
- 🖼️ Thumbnail download (JPG)
- 📝 AI Transcription (TXT/SRT)
- 🌙 Dark theme UI

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + yt-dlp
- **Deploy**: Docker + Railway

## Quick Start

```bash
# Install
cd frontend && npm install
cd ../backend && npm install

# Dev
npm run dev:frontend  # port 3000
npm run dev:backend   # port 3001

# Build & Start
npm run build
npm start
```

## Deploy to Railway

1. Push to GitHub
2. Connect to [Railway](https://railway.app)
3. Auto-deploy via Dockerfile
