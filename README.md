# 🛵 Little Electric Donkey

Professional video downloader supporting YouTube, TikTok, X/Twitter, Douyin, and more.

## ✨ Features

- 📹 **Multi-platform support**: YouTube, TikTok, X/Twitter, Douyin, Bilibili, etc.
- 🎵 **Multiple formats**: Video (MP4), Audio (MP3), Thumbnail, Subtitles
- 🤖 **AI Transcription**: Automatic speech-to-text using Whisper
- 📱 **Mobile-friendly**: Responsive design for all devices
- 🎨 **Dark theme**: Sleek dark UI design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- yt-dlp
- FFmpeg (optional, for audio extraction)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd shandian

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Create data directories
mkdir -p data downloads
```

### Development

```bash
# Start backend (port 3001)
cd backend
npm run dev

# Start frontend (port 3000)
cd frontend
npm run dev
```

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm run build
npm start
```

## 📁 Project Structure

```
shandian/
├── frontend/          # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── App.tsx   # Main application
│   │   ├── main.tsx  # Entry point
│   │   └── index.css # Styles
│   ├── index.html
│   └── package.json
├── backend/           # Express + TypeScript
│   ├── src/
│   │   └── index.ts  # Server & API
│   └── package.json
├── downloads/         # Downloaded files
├── data/              # Task data
└── README.md
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/info?url=` | Get video info |
| POST | `/api/download` | Create download task |
| GET | `/api/status/:taskId` | Get task status |
| GET | `/api/history` | Get task history |
| DELETE | `/api/tasks/:taskId` | Delete task |

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript
- **Download Engine**: yt-dlp
- **AI Transcription**: OpenAI Whisper (optional)

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

## ⚠️ Disclaimer

This tool is for **personal use only**. Please respect copyright laws and terms of service of video platforms. The developers are not responsible for any misuse of this software.

---

Made with ❤️ by Little Electric Donkey Team
