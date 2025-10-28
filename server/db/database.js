import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'flowcharts.db'));

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
export const stmt = {
  getAll: db.prepare('SELECT * FROM flowcharts ORDER BY updated_at DESC'),
  getById: db.prepare('SELECT * FROM flowcharts WHERE id = ?'),
  getByProjectName: db.prepare('SELECT * FROM flowcharts WHERE project_name = ?'),
  create: db.prepare('INSERT INTO flowcharts (project_name, data) VALUES (?, ?)'),
  update: db.prepare('UPDATE flowcharts SET project_name = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  delete: db.prepare('DELETE FROM flowcharts WHERE id = ?'),
  search: db.prepare('SELECT * FROM flowcharts WHERE project_name LIKE ? ORDER BY updated_at DESC')
};

export default db;

