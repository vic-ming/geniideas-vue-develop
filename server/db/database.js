import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { copyFile, readdir, stat, unlink } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'flowcharts.db');
const db = new Database(dbPath);

// ==================== 性能優化 ====================
console.log('🚀 優化資料庫性能設置...');

// WAL 模式提供更好的併發性和防損壞能力
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL'); // 平衡性能與安全性

// 性能優化設置
db.pragma('cache_size = -64000');  // 使用 64MB 緩存（負數表示 KB）
db.pragma('temp_store = MEMORY');  // 臨時表存儲在內存中
db.pragma('mmap_size = 30000000000'); // 使用內存映射 I/O (30GB)
db.pragma('page_size = 4096');     // 優化頁面大小

// 啟用外鍵約束
db.pragma('foreign_keys = ON');

console.log('✅ 性能優化已啟用');

// 初始化資料庫
const schema = `
  CREATE TABLE IF NOT EXISTS flowcharts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL UNIQUE,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 創建索引以加速查詢
  CREATE INDEX IF NOT EXISTS idx_flowcharts_updated_at ON flowcharts(updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_flowcharts_project_name ON flowcharts(project_name);

  CREATE TRIGGER IF NOT EXISTS update_flowcharts_timestamp
  AFTER UPDATE ON flowcharts
  BEGIN
    UPDATE flowcharts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`;

db.exec(schema);

// ==================== 基礎保護 #2: 快速完整性檢查 ====================
// 使用 quick_check 而非 integrity_check 以提高啟動速度
console.log('🔧 快速檢查資料庫...');
try {
  const quickCheck = db.pragma('quick_check');
  if (quickCheck[0].quick_check === 'ok') {
    console.log('✅ 資料庫檢查通過');
  } else {
    console.error('❌ 資料庫檢查失敗:', quickCheck);
    console.log('⚠️  建議從備份恢復資料庫');
  }
} catch (error) {
  console.error('❌ 無法檢查資料庫:', error.message);
}

// ==================== 基礎保護 #3: 自動備份機制 ====================
const backupDir = path.join(__dirname, 'backups');

// 確保備份目錄存在
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('📁 創建備份目錄:', backupDir);
}

/**
 * 創建資料庫備份（異步版本，不阻塞）
 * @param {string} reason - 備份原因（用於檔名）
 * @returns {Promise<string>} 備份檔案路徑
 */
export async function createBackup(reason = 'manual') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `flowcharts_${reason}_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // 執行 WAL checkpoint 確保所有數據寫入主資料庫（使用 TRUNCATE 而非 FULL 以減少阻塞時間）
    db.pragma('wal_checkpoint(TRUNCATE)');
    
    // 異步複製資料庫檔案
    await copyFile(dbPath, backupPath);
    
    console.log('💾 備份成功:', backupFileName);
    
    // 異步清理舊備份（保留最近 30 個）
    await cleanOldBackups();
    
    return backupPath;
  } catch (error) {
    console.error('❌ 備份失敗:', error.message);
    throw error;
  }
}

/**
 * 創建資料庫備份（同步版本，用於需要立即返回的情況）
 * @param {string} reason - 備份原因（用於檔名）
 * @returns {string} 備份檔案路徑
 */
export function createBackupSync(reason = 'manual') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `flowcharts_${reason}_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // 執行 WAL checkpoint 確保所有數據寫入主資料庫
    db.pragma('wal_checkpoint(TRUNCATE)');
    
    // 複製資料庫檔案
    fs.copyFileSync(dbPath, backupPath);
    
    console.log('💾 備份成功:', backupFileName);
    
    // 清理舊備份（保留最近 30 個）
    cleanOldBackupsSync();
    
    return backupPath;
  } catch (error) {
    console.error('❌ 備份失敗:', error.message);
    throw error;
  }
}

/**
 * 清理舊備份，保留最近 30 個（異步版本）
 */
async function cleanOldBackups() {
  try {
    const files = await readdir(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('flowcharts_') && file.endsWith('.db'))
      .map(file => path.join(backupDir, file));
    
    const filesWithStats = await Promise.all(
      backupFiles.map(async (filePath) => {
        const stats = await stat(filePath);
        return {
          name: path.basename(filePath),
          path: filePath,
          time: stats.mtime.getTime()
        };
      })
    );
    
    const sortedFiles = filesWithStats.sort((a, b) => b.time - a.time); // 按時間降序排列
    
    // 刪除第 30 個之後的備份
    if (sortedFiles.length > 30) {
      const filesToDelete = sortedFiles.slice(30);
      await Promise.all(
        filesToDelete.map(async (file) => {
          await unlink(file.path);
          console.log('🗑️  刪除舊備份:', file.name);
        })
      );
    }
  } catch (error) {
    console.error('⚠️  清理舊備份時出錯:', error.message);
  }
}

/**
 * 清理舊備份，保留最近 30 個（同步版本）
 */
function cleanOldBackupsSync() {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('flowcharts_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // 按時間降序排列
    
    // 刪除第 30 個之後的備份
    if (files.length > 30) {
      const filesToDelete = files.slice(30);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log('🗑️  刪除舊備份:', file.name);
      });
    }
  } catch (error) {
    console.error('⚠️  清理舊備份時出錯:', error.message);
  }
}

/**
 * 列出所有備份
 * @returns {Promise<Array>} 備份列表
 */
export async function listBackups() {
  try {
    const files = await readdir(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('flowcharts_') && file.endsWith('.db'))
      .map(file => path.join(backupDir, file));
    
    const filesWithStats = await Promise.all(
      backupFiles.map(async (filePath) => {
        const stats = await stat(filePath);
        return {
          name: path.basename(filePath),
          path: filePath,
          size: stats.size,
          created: stats.mtime
        };
      })
    );
    
    return filesWithStats.sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error('❌ 無法列出備份:', error.message);
    return [];
  }
}

// 啟動時自動備份（延遲執行，確保不阻塞啟動和 API 請求）
console.log('💾 啟動備份任務（將在 5 秒後執行）...');
setTimeout(async () => {
  try {
    await createBackup('startup');
  } catch (error) {
    console.error('⚠️  啟動備份失敗（不影響運行）:', error.message);
  }
}, 5000); // 延遲 5 秒執行，確保服務器完全啟動

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

// 優雅關閉處理
process.on('SIGINT', () => {
  console.log('\n🔧 正在關閉資料庫...');
  
  // 執行 checkpoint 確保數據完整性
  db.pragma('wal_checkpoint(FULL)');
  
  // 關閉資料庫連接
  db.close();
  
  console.log('✅ 資料庫已安全關閉');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔧 正在關閉資料庫...');
  db.pragma('wal_checkpoint(FULL)');
  db.close();
  console.log('✅ 資料庫已安全關閉');
  process.exit(0);
});

export default db;

