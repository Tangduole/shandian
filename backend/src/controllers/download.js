/**
 * 下载控制器 v1
 * 闪电下载器专用
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { downloadDouyin, isDouyinUrl } = require('../services/douyin');
const { downloadX, isXUrl } = require('../services/x-download');

// 内存存储任务数据
const tasks = new Map();
const TASK_EXPIRE_MS = 3600000; // 1小时

/**
 * 生成唯一任务ID
 */
function generateTaskId() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * 清理过期任务
 */
function cleanupExpiredTasks() {
  const now = Date.now();
  for (const [taskId, task] of tasks) {
    if (now - task.createdAt > TASK_EXPIRE_MS) {
      tasks.delete(taskId);
    }
  }
}

// 每30分钟清理一次过期任务
setInterval(cleanupExpiredTasks, 30 * 60 * 1000);

/**
 * 创建下载任务
 */
async function createDownload(req, res) {
  try {
    const { url, platform, needAsr, options } = req.body;
    
    if (!url) {
      return res.status(400).json({
        code: 1,
        message: '缺少视频链接'
      });
    }

    // 检测平台
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      if (isDouyinUrl(url)) detectedPlatform = 'douyin';
      else if (isXUrl(url)) detectedPlatform = 'x';
      // 其他平台检测逻辑...
    }

    const taskId = generateTaskId();
    
    // 创建任务对象
    const task = {
      taskId,
      url,
      platform: detectedPlatform,
      status: 'pending',
      progress: 0,
      title: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    tasks.set(taskId, task);

    console.log(`创建下载任务: ${taskId} (${detectedPlatform}) - ${url}`);

    // 异步执行下载
    processDownload(taskId, url, detectedPlatform, options || []).catch(err => {
      const t = tasks.get(taskId);
      if (t) {
        t.status = 'error';
        t.error = err.message;
        t.updatedAt = Date.now();
        console.error(`任务 ${taskId} 失败:`, err.message);
      }
    });

    res.json({
      code: 0,
      data: task
    });

  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({
      code: 2,
      message: `服务器错误: ${error.message}`
    });
  }
}

/**
 * 处理下载（异步）
 */
async function processDownload(taskId, url, platform, options) {
  const task = tasks.get(taskId);
  if (!task) return;

  try {
    task.status = 'processing';
    task.updatedAt = Date.now();
    
    // 进度回调
    const onProgress = (percent, speed, eta) => {
      const t = tasks.get(taskId);
      if (t) {
        t.progress = percent;
        t.updatedAt = Date.now();
      }
    };

    let result;
    
    if (platform === 'douyin') {
      result = await downloadDouyin(url, taskId, onProgress);
    } else if (platform === 'x') {
      result = await downloadX(url, taskId, onProgress);
    } else {
      throw new Error(`暂不支持的平台: ${platform}`);
    }

    // 更新任务状态
    task.status = 'completed';
    task.progress = 100;
    task.title = result.title || '未命名';
    task.downloadUrl = result.downloadUrl;
    task.thumbnailUrl = result.thumbnailUrl;
    task.subtitleFiles = result.subtitleFiles || [];
    task.images = result.images || [];
    task.isNote = result.isNote || false;
    task.updatedAt = Date.now();

    console.log(`任务完成: ${taskId} - ${task.title}`);

  } catch (error) {
    console.error(`处理任务 ${taskId} 失败:`, error);
    const t = tasks.get(taskId);
    if (t) {
      t.status = 'error';
      t.error = error.message;
      t.updatedAt = Date.now();
    }
  }
}

/**
 * 获取视频信息（不下载）
 */
async function getInfo(req, res) {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        code: 1,
        message: '缺少视频链接'
      });
    }

    // 这里可以添加解析视频信息的逻辑
    res.json({
      code: 0,
      data: {
        url,
        title: `解析信息 - ${url}`,
        platform: isDouyinUrl(url) ? 'douyin' : (isXUrl(url) ? 'x' : 'unknown'),
        canDownload: isDouyinUrl(url) || isXUrl(url) // 支持抖音和 X/Twitter
      }
    });

  } catch (error) {
    console.error('获取信息失败:', error);
    res.status(500).json({
      code: 2,
      message: `解析失败: ${error.message}`
    });
  }
}

/**
 * 查询任务状态
 */
function getStatus(req, res) {
  try {
    const { taskId } = req.params;
    const task = tasks.get(taskId);
    
    if (!task) {
      return res.status(404).json({
        code: 1,
        message: '任务不存在'
      });
    }

    res.json({
      code: 0,
      data: task
    });

  } catch (error) {
    console.error('查询状态失败:', error);
    res.status(500).json({
      code: 2,
      message: `查询失败: ${error.message}`
    });
  }
}

/**
 * 获取历史记录
 */
function getHistory(req, res) {
  try {
    const history = Array.from(tasks.values())
      .filter(task => task.status === 'completed' || task.status === 'error')
      .map(task => ({
        taskId: task.taskId,
        status: task.status,
        title: task.title,
        platform: task.platform,
        thumbnailUrl: task.thumbnailUrl,
        createdAt: task.createdAt
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50); // 最近50条

    res.json({
      code: 0,
      data: history
    });

  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({
      code: 2,
      message: `查询失败: ${error.message}`
    });
  }
}

/**
 * 删除任务
 */
function deleteTask(req, res) {
  try {
    const { taskId } = req.params;
    
    if (tasks.delete(taskId)) {
      res.json({
        code: 0,
        message: '删除成功'
      });
    } else {
      res.status(404).json({
        code: 1,
        message: '任务不存在'
      });
    }

  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({
      code: 2,
      message: `删除失败: ${error.message}`
    });
  }
}

/**
 * 系统状态
 */
function getSystemStatus(req, res) {
  try {
    const activeTasks = Array.from(tasks.values())
      .filter(task => task.status !== 'completed' && task.status !== 'error')
      .length;

    res.json({
      code: 0,
      data: {
        tasks: {
          total: tasks.size,
          active: activeTasks,
          completed: Array.from(tasks.values()).filter(t => t.status === 'completed').length,
          error: Array.from(tasks.values()).filter(t => t.status === 'error').length
        },
        platform: '闪电下载器',
        version: '1.0.0',
        uptime: process.uptime()
      }
    });

  } catch (error) {
    console.error('获取系统状态失败:', error);
    res.status(500).json({
      code: 2,
      message: `查询失败: ${error.message}`
    });
  }
}

module.exports = {
  createDownload,
  getInfo,
  getStatus,
  getHistory,
  deleteTask,
  getSystemStatus
};
