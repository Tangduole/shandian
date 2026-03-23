import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import YTDlpWrap from 'yt-dlp-wrap'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Config
const PORT = Number(process.env.PORT) || 3001
const DOWNLOAD_DIR = join(process.cwd(), 'downloads')
const DATA_DIR = join(process.cwd(), 'data')
const FRONTEND_DIST = join(process.cwd(), 'frontend', 'dist')

// yt-dlp
const YTDLP_PATH = '/usr/local/bin/yt-dlp'
const ytDlp = existsSync(YTDLP_PATH)
  ? new YTDlpWrap(YTDLP_PATH)
  : new YTDlpWrap()

// Ensure directories
if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true })
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

// Types
interface DownloadTask {
  taskId: string
  url: string
  platform?: string
  options: string[]
  status: 'pending' | 'processing' | 'downloading' | 'asr' | 'completed' | 'error'
  progress: number
  title?: string
  thumbnail?: string
  downloadUrl?: string
  asrText?: string
  error?: string
  createdAt: string
  updatedAt: string
}

// Storage
const TASKS_FILE = join(DATA_DIR, 'tasks.json')

function loadTasks(): Record<string, DownloadTask> {
  try {
    if (existsSync(TASKS_FILE)) {
      return JSON.parse(readFileSync(TASKS_FILE, 'utf-8'))
    }
  } catch (err) {
    console.error('Failed to load tasks:', err)
  }
  return {}
}

function saveTasks(tasks: Record<string, DownloadTask>) {
  try {
    writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2))
  } catch (err) {
    console.error('Failed to save tasks:', err)
  }
}

const tasks = loadTasks()

// Express
const app = express()
app.use(cors())
app.use(express.json())

// Serve frontend
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST))
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Video info
app.get('/api/info', async (req, res) => {
  const url = req.query.url as string
  if (!url) return res.status(400).json({ success: false, message: 'URL is required' })
  try {
    const info = await ytDlp.getVideoInfo(url)
    res.json({ success: true, data: { title: info.title, thumbnail: info.thumbnail, duration: info.duration } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to get video info'
    res.status(500).json({ success: false, message: msg })
  }
})

// Create task
app.post('/api/download', async (req, res) => {
  const { url, platform, options = ['video'] } = req.body
  if (!url) return res.status(400).json({ success: false, message: 'URL is required' })

  const taskId = uuidv4()
  const now = new Date().toISOString()
  const task: DownloadTask = { taskId, url, platform, options, status: 'pending', progress: 0, createdAt: now, updatedAt: now }
  tasks[taskId] = task
  saveTasks(tasks)
  processDownload(taskId).catch(e => console.error('Task error:', e))
  res.json({ success: true, data: { taskId, status: 'pending' } })
})

// Task status
app.get('/api/status/:taskId', (req, res) => {
  const t = tasks[req.params.taskId]
  if (!t) return res.status(404).json({ success: false, message: 'Not found' })
  res.json({ success: true, data: t })
})

// History
app.get('/api/history', (_req, res) => {
  const list = Object.values(tasks).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50)
  res.json({ success: true, data: list })
})

// Delete task
app.delete('/api/tasks/:taskId', (req, res) => {
  if (!tasks[req.params.taskId]) return res.status(404).json({ success: false, message: 'Not found' })
  delete tasks[req.params.taskId]
  saveTasks(tasks)
  res.json({ success: true, message: 'Deleted' })
})

// Downloads
app.use('/downloads', express.static(DOWNLOAD_DIR))

// SPA fallback
if (existsSync(FRONTEND_DIST)) {
  app.get('*', (_req, res) => {
    res.sendFile(join(FRONTEND_DIST, 'index.html'))
  })
}

// Download processor
async function processDownload(taskId: string) {
  const task = tasks[taskId]
  if (!task) return

  try {
    task.status = 'processing'
    task.updatedAt = new Date().toISOString()
    saveTasks(tasks)

    const info = await ytDlp.getVideoInfo(task.url)
    task.title = info.title
    task.thumbnail = info.thumbnail
    task.platform = info.extractor
    task.progress = 10
    saveTasks(tasks)

    const taskDir = join(DOWNLOAD_DIR, taskId)
    if (!existsSync(taskDir)) mkdirSync(taskDir, { recursive: true })

    if (task.options.includes('video')) {
      task.status = 'downloading'
      task.progress = 30
      saveTasks(tasks)

      const outPath = join(taskDir, 'video.%(ext)s')
      await new Promise<void>((resolve, reject) => {
        const proc = ytDlp.exec([
          task.url,
          '-o', outPath,
          '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
          '--merge-output-format', 'mp4',
          '--no-warnings'
        ])
        proc.stdout?.on('data', (chunk: Buffer) => {
          const m = chunk.toString().match(/(\d+\.?\d*)%/)
          if (m) { task.progress = Math.round(30 + parseFloat(m[1]) * 0.6); saveTasks(tasks) }
        })
        proc.on('close', (code: number | null) => code === 0 ? resolve() : reject(new Error(`Exit code ${code}`)))
        proc.on('error', reject)
      })

      const files = readdirSync(taskDir)
      const vf = files.find(f => f.startsWith('video.'))
      if (vf) task.downloadUrl = `/downloads/${taskId}/${vf}`
    }

    if (task.options.includes('transcription') || task.options.includes('subtitles')) {
      task.status = 'asr'
      task.progress = 90
      saveTasks(tasks)
      await new Promise(r => setTimeout(r, 1000))
      task.asrText = '[ASR placeholder]'
    }

    task.status = 'completed'
    task.progress = 100
    task.updatedAt = new Date().toISOString()
    saveTasks(tasks)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    task.status = 'error'
    task.error = msg
    task.updatedAt = new Date().toISOString()
    saveTasks(tasks)
  }
}

app.listen(PORT, () => {
  console.log(`⚡ 闪电下载器 running on port ${PORT}`)
})
