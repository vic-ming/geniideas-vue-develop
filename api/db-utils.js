import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 在 Vercel serverless 环境中，使用 /tmp 目录存储数据库
// 因为 /tmp 是唯一可写的目录
const isVercel = process.env.VERCEL === '1';

let db = null;
let dbPath = null;

/**
 * 获取数据库路径
 */
export function getDbPath() {
  if (dbPath) {
    return dbPath;
  }

  const dbDir = isVercel 
    ? '/tmp' 
    : path.join(process.cwd(), 'server/db');

  // 确保目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbPath = path.join(dbDir, 'flowcharts.db');
  return dbPath;
}

/**
 * 获取数据库实例（单例模式）
 */
export function getDatabase() {
  if (db) {
    return db;
  }

  const currentDbPath = getDbPath();

  // 如果数据库文件不存在，尝试从项目目录复制（仅本地开发）
  if (!fs.existsSync(currentDbPath) && !isVercel) {
    const sourceDb = path.join(process.cwd(), 'server/db/flowcharts.db');
    if (fs.existsSync(sourceDb)) {
      try {
        fs.copyFileSync(sourceDb, currentDbPath);
      } catch (error) {
        console.warn('无法复制源数据库文件:', error.message);
      }
    }
  }

  db = new Database(currentDbPath);

  // 性能优化设置
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 30000000000');
  db.pragma('page_size = 4096');
  db.pragma('foreign_keys = ON');

  // 初始化数据库表结构
  const schema = `
    CREATE TABLE IF NOT EXISTS flowcharts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL UNIQUE,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_flowcharts_updated_at ON flowcharts(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_flowcharts_project_name ON flowcharts(project_name);

    CREATE TRIGGER IF NOT EXISTS update_flowcharts_timestamp
    AFTER UPDATE ON flowcharts
    BEGIN
      UPDATE flowcharts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `;

  db.exec(schema);

  return db;
}

/**
 * 获取准备好的语句
 */
export function getStatements() {
  const db = getDatabase();
  return {
    getAll: db.prepare('SELECT * FROM flowcharts ORDER BY updated_at DESC'),
    getById: db.prepare('SELECT * FROM flowcharts WHERE id = ?'),
    getByProjectName: db.prepare('SELECT * FROM flowcharts WHERE project_name = ?'),
    create: db.prepare('INSERT INTO flowcharts (project_name, data) VALUES (?, ?)'),
    update: db.prepare('UPDATE flowcharts SET project_name = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
    delete: db.prepare('DELETE FROM flowcharts WHERE id = ?'),
    search: db.prepare('SELECT * FROM flowcharts WHERE project_name LIKE ? ORDER BY updated_at DESC')
  };
}

