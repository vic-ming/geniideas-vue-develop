-- 資料庫 Schema
CREATE TABLE IF NOT EXISTS flowcharts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 更新 updated_at 的觸發器
CREATE TRIGGER IF NOT EXISTS update_flowcharts_timestamp
AFTER UPDATE ON flowcharts
BEGIN
  UPDATE flowcharts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;


