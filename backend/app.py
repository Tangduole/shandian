from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import uuid
import os
import threading
import hashlib
import json
import time
import re

app = Flask(__name__)
CORS(app)

DOWNLOAD_DIR = os.path.join(os.getcwd(), 'shandian_downloads')
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# 任务存储
tasks = {}
TASKS_FILE = os.path.join(os.getcwd(), 'shandian_tasks.json')

def load_tasks():
    global tasks
    try:
        if os.path.exists(TASKS_FILE):
            with open(TASKS_FILE, 'r') as f:
                tasks = json.load(f)
    except:
        tasks = {}

def save_tasks():
    try:
        with open(TASKS_FILE, 'w') as f:
            json.dump(tasks, f, ensure_ascii=False, indent=2)
    except:
        pass

load_tasks()

def get_ydl_opts(format_type='video'):
    if format_type == 'audio':
        return {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(DOWNLOAD_DIR, '%(id)s.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'quiet': True,
            'no_warnings': True,
        }
    elif format_type == 'thumbnail':
        return {
            'skip_download': True,
            'writethumbnail': True,
            'outtmpl': os.path.join(DOWNLOAD_DIR, '%(id)s'),
            'quiet': True,
            'no_warnings': True,
        }
    else:  # video
        return {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': os.path.join(DOWNLOAD_DIR, '%(id)s.%(ext)s'),
            'merge_output_format': 'mp4',
            'quiet': True,
            'no_warnings': True,
        }

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'yt-dlp': yt_dlp.version.__version__})

@app.route('/api/info')
def get_info():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'URL required'}), 400
    try:
        with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True}) as ydl:
            info = ydl.extract_info(url, download=False)
            return jsonify({
                'title': info.get('title', ''),
                'thumbnail': info.get('thumbnail', ''),
                'duration': info.get('duration', 0),
                'extractor': info.get('extractor', ''),
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download', methods=['POST'])
def download():
    data = request.get_json() or {}
    url = data.get('url', '').strip()
    fmt = data.get('format', 'video')
    
    if not url:
        return jsonify({'error': 'URL required'}), 400
    
    task_id = str(uuid.uuid4())[:8]
    tasks[task_id] = {
        'taskId': task_id,
        'url': url,
        'format': fmt,
        'status': 'pending',
        'progress': 0,
        'title': '',
        'thumbnail': '',
        'fileName': '',
        'fileSize': 0,
        'error': '',
        'createdAt': time.time(),
    }
    save_tasks()
    
    # 启动后台下载
    threading.Thread(target=process_download, args=(task_id,), daemon=True).start()
    
    return jsonify({'success': True, 'taskId': task_id})

@app.route('/api/status/<task_id>')
def status(task_id):
    task = tasks.get(task_id)
    if not task:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'success': True, 'data': task})

@app.route('/api/file/<task_id>')
def get_file(task_id):
    task = tasks.get(task_id)
    if not task or task['status'] != 'completed':
        return jsonify({'error': 'Not ready'}), 404
    
    filepath = os.path.join(DOWNLOAD_DIR, task['fileName'])
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(filepath, as_attachment=True, download_name=task['fileName'])

@app.route('/api/history')
def history():
    history_list = sorted(tasks.values(), key=lambda x: x.get('createdAt', 0), reverse=True)[:30]
    return jsonify({'success': True, 'data': history_list})

def process_download(task_id):
    task = tasks.get(task_id)
    if not task:
        return
    
    try:
        task['status'] = 'downloading'
        task['progress'] = 10
        save_tasks()
        
        ydl_opts = get_ydl_opts(task['format'])
        
        # 添加进度回调
        def progress_hook(d):
            if d['status'] == 'downloading':
                total = d.get('total_bytes', d.get('total_bytes_estimate', 0))
                downloaded = d.get('downloaded_bytes', 0)
                if total > 0:
                    task['progress'] = int(10 + (downloaded / total) * 80)
                    task['status'] = 'downloading'
                    save_tasks()
            elif d['status'] == 'finished':
                task['progress'] = 95
                task['status'] = 'processing'
                save_tasks()
            elif d['status'] == 'error':
                task['status'] = 'error'
                task['error'] = str(d.get('error', 'Unknown error'))
                save_tasks()
        
        ydl_opts['progress_hooks'] = [progress_hook]
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(task['url'], download=True)
            task['title'] = info.get('title', '')
            task['thumbnail'] = info.get('thumbnail', '')
        
        # 找下载的文件
        video_id = info.get('id', '')
        ext = 'mp3' if task['format'] == 'audio' else 'mp4'
        
        # 查找实际文件
        found_file = ''
        for f in os.listdir(DOWNLOAD_DIR):
            if f.startswith(video_id):
                found_file = f
                break
        
        if not found_file:
            # 查找最近创建的文件
            files = sorted(os.listdir(DOWNLOAD_DIR), key=lambda x: os.path.getmtime(os.path.join(DOWNLOAD_DIR, x)), reverse=True)
            if files:
                found_file = files[0]
        
        if found_file:
            filepath = os.path.join(DOWNLOAD_DIR, found_file)
            task['fileName'] = found_file
            task['fileSize'] = os.path.getsize(filepath)
            task['status'] = 'completed'
            task['progress'] = 100
        else:
            task['status'] = 'error'
            task['error'] = 'Downloaded file not found'
        
        save_tasks()
        
    except Exception as e:
        task['status'] = 'error'
        task['error'] = str(e)
        task['progress'] = 0
        save_tasks()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=False, threaded=True)
