import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let statements = null;

// 初始化数据库（延迟初始化）
function initDatabase() {
  if (db && statements) {
    return { db, stmt: statements };
  }

  try {
    // 在 Vercel 上使用 /tmp 目录，本地使用项目目录
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    const dbDir = isVercel ? '/tmp' : __dirname;
    const dbPath = path.join(dbDir, 'flowcharts.db');

    // 确保目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 如果在 Vercel 上且数据库文件不存在，尝试从项目目录复制（如果有）
    if (isVercel && !fs.existsSync(dbPath)) {
      const localDbPath = path.join(__dirname, 'flowcharts.db');
      if (fs.existsSync(localDbPath)) {
        try {
          fs.copyFileSync(localDbPath, dbPath);
        } catch (error) {
          console.log('Could not copy existing database, will create new one');
        }
      }
    }

    db = new Database(dbPath);

    // 啟用外鍵約束
    db.pragma('foreign_keys = ON');

    // 初始化資料庫
    const schema = `
      CREATE TABLE IF NOT EXISTS flowcharts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TRIGGER IF NOT EXISTS update_flowcharts_timestamp
      AFTER UPDATE ON flowcharts
      BEGIN
        UPDATE flowcharts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `;

    db.exec(schema);

    // 準備好的語句
    statements = {
      getAll: db.prepare('SELECT * FROM flowcharts ORDER BY updated_at DESC'),
      getById: db.prepare('SELECT * FROM flowcharts WHERE id = ?'),
      getByProjectName: db.prepare('SELECT * FROM flowcharts WHERE project_name = ?'),
      create: db.prepare('INSERT INTO flowcharts (project_name, data) VALUES (?, ?)'),
      update: db.prepare('UPDATE flowcharts SET project_name = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
      delete: db.prepare('DELETE FROM flowcharts WHERE id = ?'),
      search: db.prepare('SELECT * FROM flowcharts WHERE project_name LIKE ? ORDER BY updated_at DESC')
    };

    return { db, stmt: statements };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// 获取数据库实例（延迟初始化）
export function getDatabase() {
  return initDatabase();
}

// 导出 stmt（向后兼容，但会在第一次使用时初始化）
export const stmt = new Proxy({}, {
  get(target, prop) {
    const { stmt: statements } = initDatabase();
    return statements[prop];
  }
});

export default getDatabase;

