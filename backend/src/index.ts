import express from 'express'
import cors from 'cors'
import YTDlpWrap from 'yt-dlp-wrap'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PORT = Number(process.env.PORT) || 3001
const DOWNLOAD_DIR = join(process.cwd(), 'downloads')
const ytDlp = YTDlpWrap.default ? new YTDlpWrap.default() : new (YTDlpWrap as any)()

if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true })

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Info
app.get('/api/info', async (req, res) => {
  try {
    const url = req.query.url as string
    if (!url) return res.status(400).json({ error: 'URL required' })
    const info = await ytDlp.getVideoInfo(url)
    res.json({ title: info.title, thumbnail: info.thumbnail, duration: info.duration, extractor: info.extractor })
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed' })
  }
})

// Download - 直接返回文件流
app.post('/api/download', async (req, res) => {
  try {
    const { url, format = 'video' } = req.body
    if (!url) return res.status(400).json({ error: 'URL required' })

    const hash = createHash('sha256').update(url + format + Date.now()).digest('hex').slice(0, 12)
    const outFile = join(DOWNLOAD_DIR, `${hash}.%(ext)s`)

    let args: string[] = [url, '-o', outFile, '--no-warnings']

    if (format === 'audio') {
      args = [...args, '-x', '--audio-format', 'mp3', '--audio-quality', '0']
    } else {
      args = [...args, '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '--merge-output-format', 'mp4']
    }

    await new Promise<void>((resolve, reject) => {
      const proc = ytDlp.exec(args)
      proc.on('close', (code: number) => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)))
      proc.on('error', reject)
    })

    // 找到下载的文件
    const files = readdirSync(DOWNLOAD_DIR).filter(f => f.startsWith(hash))
    if (files.length === 0) return res.status(500).json({ error: 'Download failed' })

    const filePath = join(DOWNLOAD_DIR, files[0])
    const fileName = files[0]

    res.download(filePath, fileName, (err) => {
      if (!err) {
        // 下载完后删除文件
        setTimeout(() => { try { unlinkSync(filePath) } catch {} }, 5000)
      }
    })
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Download failed' })
  }
})

app.listen(PORT, () => console.log(`⚡ Backend on ${PORT}`))
