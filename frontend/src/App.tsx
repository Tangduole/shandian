import { useState } from 'react'
import { 
  Download, 
  Link2, 
  CheckCircle2,
  ExternalLink,
  Video,
  Music,
  FileText,
  Zap,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react'

function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'YouTube'
  if (/tiktok\.com/i.test(url)) return 'TikTok'
  if (/twitter\.com|x\.com/i.test(url)) return 'X / Twitter'
  if (/douyin\.com/i.test(url)) return '抖音'
  if (/bilibili\.com|b23\.tv/i.test(url)) return 'Bilibili'
  if (/instagram\.com/i.test(url)) return 'Instagram'
  if (/facebook\.com|fb\.watch/i.test(url)) return 'Facebook'
  if (/reddit\.com/i.test(url)) return 'Reddit'
  if (/pinterest\.com/i.test(url)) return 'Pinterest'
  return ''
}

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'x', label: 'X / Twitter', icon: '🐦' },
  { id: 'douyin', label: '抖音', icon: '📱' },
  { id: 'bilibili', label: 'Bilibili', icon: '📺' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
]

function App() {
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [detected, setDetected] = useState('')

  const handleUrlChange = (value: string) => {
    setUrl(value)
    if (value.trim()) {
      const p = detectPlatform(value)
      setDetected(p)
    } else {
      setDetected('')
    }
  }

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter a video link')
      return
    }

    setError('')

    // Copy URL to clipboard
    try {
      await navigator.clipboard.writeText(url.trim())
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      setCopied(false)
    }

    // Open cobalt.tools (open source, no ads)
    window.open('https://cobalt.tools', '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="max-w-2xl mx-auto px-6 pt-16 pb-8 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white">闪电下载器</h1>
              <p className="text-xs text-slate-400">Lightning Downloader</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            粘贴链接 → 一键跳转下载 · 支持 1000+ 网站
          </p>
        </header>

        <main className="max-w-2xl mx-auto px-6 pb-10">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/60 shadow-xl">
            
            {/* URL Input */}
            <div className="mb-5">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Link2 className="w-5 h-5" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="粘贴视频链接..."
                  className="w-full pl-12 pr-12 py-4 bg-slate-900/60 border-2 border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/70 outline-none text-white text-base transition-all placeholder:text-slate-500"
                />
                {detected && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-500/15 text-blue-300 text-xs rounded-lg border border-blue-500/20">
                    {detected}
                  </div>
                )}
              </div>
            </div>

            {/* Supported Platforms */}
            <div className="mb-6">
              <p className="text-xs text-slate-500 mb-2">支持平台</p>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => (
                  <span key={p.id} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700/40 text-slate-400 text-xs rounded-lg">
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </span>
                ))}
                <span className="px-2.5 py-1.5 bg-slate-700/40 text-slate-500 text-xs rounded-lg">
                  + 更多
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={!url.trim()}
              className="w-full py-4 rounded-2xl font-bold text-white text-base bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  链接已复制！跳转中...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  闪电下载
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              点击后自动复制链接并跳转，在打开的页面中粘贴即可
            </p>
          </div>

          {/* How to use */}
          <div className="mt-5 bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              使用方法
            </h3>
            <div className="space-y-2.5 text-sm text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold text-xs mt-0.5">1</span>
                <p>复制任意平台的视频链接</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold text-xs mt-0.5">2</span>
                <p>粘贴到上方输入框</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold text-xs mt-0.5">3</span>
                <p>点击「闪电下载」按钮</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold text-xs mt-0.5">4</span>
                <p>在打开的页面中粘贴链接，选择格式下载</p>
              </div>
            </div>
          </div>

          {/* Powered by */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-600">
              Powered by <a href="https://cobalt.tools" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-300 underline">cobalt.tools</a> · 开源免费
            </p>
          </div>
        </main>

        <footer className="text-center py-8 text-slate-600 text-xs">
          <p>闪电下载器 v1.0 · 仅供个人学习使用</p>
        </footer>
      </div>
    </div>
  )
}

export default App
