import { getDatabase, getDbPath } from './db-utils.js';
import fs from 'fs';
import path from 'path';

/**
 * 创建数据库备份
 */
function createBackup(reason = 'manual') {
  const db = getDatabase();
  const isVercel = process.env.VERCEL === '1';
  const backupDir = isVercel 
    ? '/tmp/backups' 
    : path.join(process.cwd(), 'server/db/backups');

  // 确保备份目录存在
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `flowcharts_${reason}_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // 执行 WAL checkpoint 确保所有数据写入主数据库
    db.pragma('wal_checkpoint(FULL)');
    
    // 获取数据库路径并复制
    const currentDbPath = getDbPath();
    fs.copyFileSync(currentDbPath, backupPath);
    
    return backupPath;
  } catch (error) {
    console.error('❌ 備份失敗:', error.message);
    throw error;
  }
}

/**
 * 列出所有备份
 */
function listBackups() {
  const isVercel = process.env.VERCEL === '1';
  const backupDir = isVercel 
    ? '/tmp/backups' 
    : path.join(process.cwd(), 'server/db/backups');

  if (!fs.existsSync(backupDir)) {
    return [];
  }

  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('flowcharts_') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);
    
    return files;
  } catch (error) {
    console.error('❌ 無法列出備份:', error.message);
    return [];
  }
}

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // 创建手动备份
      const backupPath = createBackup('manual');
      return res.status(200).json({ 
        success: true, 
        message: '備份成功',
        backupPath 
      });
    }

    if (req.method === 'GET') {
      // 列出所有备份
      const backups = listBackups();
      return res.status(200).json({ 
        success: true, 
        data: backups 
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in backup API:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}

