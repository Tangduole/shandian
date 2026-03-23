import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { 
  Download, 
  Link2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Video,
  Music,
  Image as ImageIcon,
  FileText,
  Languages,
  Folder,
  ChevronRight,
  Trash2,
  X
} from 'lucide-react'

const API = '/api'

// Types
interface Task {
  taskId: string
  status: 'pending' | 'processing' | 'downloading' | 'asr' | 'completed' | 'error'
  progress: number
  title?: string
  platform?: string
  thumbnail?: string
  downloadUrl?: string
  asrText?: string
  error?: string
  createdAt: string
}

// Platform config
const PLATFORMS = [
  { id: 'auto', label: 'Auto-detect', icon: '🎯' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'x', label: 'X / Twitter', icon: '🐦' },
  { id: 'douyin', label: '抖音', icon: '📱' },
  { id: 'bilibili', label: 'Bilibili', icon: '📺' },
]

// Download options
const DOWNLOAD_OPTIONS = [
  { id: 'video', label: 'Download Video', format: 'MP4', icon: Video },
  { id: 'audio', label: 'Audio Only', format: 'MP3', icon: Music },
  { id: 'thumbnail', label: 'Video Thumbnail', format: 'JPG', icon: ImageIcon },
  { id: 'transcription', label: 'Transcription TXT', format: 'TXT', icon: FileText },
  { id: 'subtitles', label: 'Subtitles', format: 'SRT/VTT', icon: Languages },
]

function App() {
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState('auto')
  const [selectedOptions, setSelectedOptions] = useState(['video'])
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Polling task status
  useEffect(() => {
    if (!task || task.status === 'completed' || task.status === 'error') return
    
    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/status/${task.taskId}`)
        const t = res.data.data
        if (t) {
          setTask(t)
          if (t.status === 'completed' || t.status === 'error') {
            clearInterval(timer)
          }
        }
      } catch (err) {
        console.error('Polling failed:', err)
      }
    }, 2000)

    return () => clearInterval(timer)
  }, [task])

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('Please enter a video link')
      return
    }
    if (selectedOptions.length === 0) {
      setError('Please select at least one download option')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/download`, { 
        url: url.trim(), 
        platform: platform === 'auto' ? undefined : platform, 
        options: selectedOptions
      })
      setTask(res.data.data)
      setUrl('')
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Download className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">闪电下载器</h1>
              <p className="text-sm text-slate-400">Lightning Downloader</p>
            </div>
          </div>
          
          <p className="text-slate-400 max-w-lg mx-auto">
            Download videos from YouTube, TikTok, X (Twitter), Douyin, and more.
            <span className="text-orange-400"> With AI transcription.</span>
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-10 space-y-6">
        {/* Main Form Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700">
          
          {/* Platform Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Supported Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    platform === p.id
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Download Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Select what to download
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DOWNLOAD_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = selectedOptions.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-orange-500' : 'bg-slate-600'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {opt.label}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-orange-200' : 'text-slate-400'}`}>
                        {opt.format}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Paste video link
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Link2 className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border-2 border-slate-600 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-white text-base transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* 下载目录 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Download directory
            </label>
            <div className="flex items-center gap-3 p-4 bg-slate-900/50 border-2 border-slate-600 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                <Folder className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Mobile phone gallery</p>
                <p className="text-sm text-slate-400">/storage/emulated/0/Download</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || selectedOptions.length === 0}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-slate-800 hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Start Download
              </>
            )}
          </button>

          {selectedOptions.length === 0 && (
            <p className="mt-3 text-center text-sm text-orange-400">
              Please select at least one download option
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-500 text-sm">
        <p>闪电下载器 v1.0.0</p>
        <p className="mt-1">Powered by yt-dlp & Whisper</p>
        <p className="mt-2 text-xs">请尊重版权法规，仅供个人学习使用</p>
      </footer>
    </div>
  )
}

export default App
