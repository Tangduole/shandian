import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import YTDlpWrap from 'yt-dlp-wrap'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Config
const PORT = process.env.PORT || 3001
const DOWNLOAD_DIR = join(process.cwd(), 'downloads')
const DATA_DIR = join(process.cwd(), 'data')
const ytDlp = new YTDlpWrap()

// Ensure directories exist
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

// Data storage
const getTasksFile = () => join(DATA_DIR, 'tasks.json')

const loadTasks = (): Record<string, DownloadTask> => {
  try {
    const file = getTasksFile()
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, 'utf-8'))
    }
  } catch (err) {
    console.error('Failed to load tasks:', err)
  }
  return {}
}

const saveTasks = (tasks: Record<string, DownloadTask>) => {
  try {
    writeFileSync(getTasksFile(), JSON.stringify(tasks, null, 2))
  } catch (err) {
    console.error('Failed to save tasks:', err)
  }
}

let tasks = loadTasks()

// Express app
const app = express()
app.use(cors())
app.use(express.json())

// Serve static frontend files in production
const frontendDistPath = join(process.cwd(), 'frontend', 'dist')
if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath))
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Get video info
app.get('/api/info', async (req, res) => {
  try {
    const { url } = req.query
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'URL is required' })
    }

    const info = await ytDlp.getVideoInfo(url)
    
    res.json({
      success: true,
      data: {
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        platform: info.extractor,
      }
    })
  } catch (err: any) {
    console.error('Get info error:', err)
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to get video info' 
    })
  }
})

// Create download task
app.post('/api/download', async (req, res) => {
  try {
    const { url, platform, options = ['video'] } = req.body
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' })
    }

    const taskId = uuidv4()
    const task: DownloadTask = {
      taskId,
      url,
      platform,
      options,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    tasks[taskId] = task
    saveTasks(tasks)

    // Start processing
    processDownload(taskId)

    res.json({ success: true, data: { taskId, status: 'pending' } })
  } catch (e: any) {
    console.error('Create task error:', e)
    res.status(500).json({ 
      success: false, 
      message: e.message || 'Failed to create task' 
    })
  }
})

// Get task status
app.get('/api/status/:taskId', (req, res) => {
  const { taskId } = req.params
  const task = tasks[taskId]
  
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' })
  }
  
  res.json({ success: true, data: task })
})

// Get history
app.get('/api/history', (req, res) => {
  const history = Object.values(tasks)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50)
  
  res.json({ success: true, data: history })
})

// Delete task
app.delete('/api/tasks/:taskId', (req, res) => {
  const { taskId } = req.params
  
  if (!tasks[taskId]) {
    return res.status(404).json({ success: false, message: 'Task not found' })
  }
  
  delete tasks[taskId]
  saveTasks(tasks)
  
  res.json({ success: true, message: 'Task deleted' })
})

// Serve downloads
app.use('/downloads', express.static(DOWNLOAD_DIR))

// Serve frontend for all other routes (SPA support)
if (existsSync(frontendDistPath)) {
  app.get('*', (req, res) => {
    res.sendFile(join(frontendDistPath, 'index.html'))
  })
}

// Process download
async function processDownload(taskId: string) {
  const task = tasks[taskId]
  if (!task) return

  try {
    // Update status to processing
    task.status = 'processing'
    task.updatedAt = new Date().toISOString()
    tasks[taskId] = task
    saveTasks(tasks)

    // Get video info
    task.progress = 10
    const info = await ytDlp.getVideoInfo(task.url)
    task.title = info.title
    task.thumbnail = info.thumbnail
    task.platform = info.extractor
    tasks[taskId] = task
    saveTasks(tasks)

    // Create task directory
    const taskDir = join(DOWNLOAD_DIR, taskId)
    if (!existsSync(taskDir)) mkdirSync(taskDir, { recursive: true })

    // Download based on options
    if (task.options.includes('video')) {
      task.status = 'downloading'
      task.progress = 30
      tasks[taskId] = task
      saveTasks(tasks)

      const outputPath = join(taskDir, 'video.%(ext)s')
      
      await new Promise<void>((resolve, reject) => {
        const download = ytDlp.exec([
          task.url,
          '-o', outputPath,
          '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
          '--merge-output-format', 'mp4',
          '--no-warnings'
        ])

        let lastProgress = 30
        download.stdout?.on('data', (data) => {
          const output = data.toString()
          const progressMatch = output.match(/(\d+\.?\d*)%/)
          if (progressMatch) {
            const progress = parseFloat(progressMatch[1])
            lastProgress = 30 + (progress * 0.6)
            task.progress = Math.round(lastProgress)
            tasks[taskId] = task
            saveTasks(tasks)
          }
        })

        download.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`Download failed with code ${code}`))
        })

        download.on('error', reject)
      })

      // Find downloaded file
      const files = readdirSync(taskDir)
      const videoFile = files.find(f => f.startsWith('video.'))
      if (videoFile) {
        task.downloadUrl = `/downloads/${taskId}/${videoFile}`
      }
    }

    // ASR placeholder
    if (task.options.includes('transcription') || task.options.includes('subtitles')) {
      task.status = 'asr'
      task.progress = 90
      tasks[taskId] = task
      saveTasks(tasks)
      await new Promise(resolve => setTimeout(resolve, 2000))
      task.asrText = "[ASR 预留功能] 请使用本地部署版本体验完整功能"
    }

    // Complete
    task.status = 'completed'
    task.progress = 100
    task.updatedAt = new Date().toISOString()
    tasks[taskId] = task
    saveTasks(tasks)

  } catch (err: any) {
    console.error('Process download error:', err)
    task.status = 'error'
    task.error = err.message || 'Unknown error'
    task.updatedAt = new Date().toISOString()
    tasks[taskId] = task
    saveTasks(tasks)
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`闪电下载器 server running on port ${PORT}`)
  console.log(`API: http://localhost:${PORT}/api`)
})
