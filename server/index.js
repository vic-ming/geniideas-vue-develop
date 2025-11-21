import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import { stmt, createBackup, listBackups } from './db/database.js';

const app = express();
const PORT = 3001;
const execFileAsync = promisify(execFile);

// ==================== 備份節流機制 ====================
let lastBackupTime = 0;
const BACKUP_COOLDOWN = 30000; // 30秒內不重複備份

/**
 * 異步備份，不阻塞 API 響應
 * @param {string} reason - 備份原因
 */
function asyncBackup(reason) {
  const now = Date.now();
  if (now - lastBackupTime < BACKUP_COOLDOWN) {
    console.log(`⏭️  跳過備份（${reason}）- 距離上次備份未滿 30 秒`);
    return;
  }
  
  lastBackupTime = now;
  setImmediate(async () => {
    try {
      await createBackup(reason);
    } catch (error) {
      console.error(`⚠️  異步備份失敗（${reason}）:`, error.message);
    }
  });
}

const sanitizeFilename = (name = 'flowchart') => {
  const raw = String(name).trim() || 'flowchart';
  const fallback = raw.replace(/[\\/?%*:|"<>]/g, '_').replace(/[^\x20-\x7E]/g, '_');
  return {
    fallback: fallback || 'flowchart',
    original: raw
  };
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// 請求日誌中間件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== API Routes ====================

// 健康檢查端點
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// 取得所有檔案列表
app.get('/api/flowcharts', (req, res) => {
  try {
    const flowcharts = stmt.getAll.all();
    res.json({ success: true, data: flowcharts });
  } catch (error) {
    console.error('Error fetching flowcharts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 搜尋檔案
app.get('/api/flowcharts/search', (req, res) => {
  try {
    const { q } = req.query;
    const searchTerm = `%${q}%`;
    const flowcharts = stmt.search.all(searchTerm);
    res.json({ success: true, data: flowcharts });
  } catch (error) {
    console.error('Error searching flowcharts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 取得單一檔案
app.get('/api/flowcharts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const flowchart = stmt.getById.get(id);
    
    if (!flowchart) {
      return res.status(404).json({ success: false, error: 'Flowchart not found' });
    }
    
    res.json({ success: true, data: flowchart });
  } catch (error) {
    console.error('Error fetching flowchart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 建立新檔案
app.post('/api/flowcharts', (req, res) => {
  try {
    const { project_name, data } = req.body;
    
    if (!project_name || !data) {
      return res.status(400).json({ success: false, error: 'project_name and data are required' });
    }
    
    const result = stmt.create.run(project_name, JSON.stringify(data));
    
    // 異步備份，不阻塞響應
    asyncBackup('auto-create');
    
    res.json({ success: true, data: { id: result.lastInsertRowid, project_name, data } });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, error: '系統存在同名檔案' });
    }
    console.error('Error creating flowchart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新檔案
app.put('/api/flowcharts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { project_name, data } = req.body;
    
    if (!project_name || !data) {
      return res.status(400).json({ success: false, error: 'project_name and data are required' });
    }
    
    const result = stmt.update.run(project_name, JSON.stringify(data), id);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Flowchart not found' });
    }
    
    // 異步備份，不阻塞響應
    asyncBackup('auto-update');
    
    res.json({ success: true, message: 'Flowchart updated successfully' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, error: '系統存在同名檔案' });
    }
    console.error('Error updating flowchart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 刪除檔案
app.delete('/api/flowcharts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = stmt.delete.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Flowchart not found' });
    }
    
    res.json({ success: true, message: 'Flowchart deleted successfully' });
  } catch (error) {
    console.error('Error deleting flowchart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 備份管理 API ====================

// 創建手動備份
app.post('/api/backup', async (req, res) => {
  try {
    const backupPath = await createBackup('manual');
    res.json({ 
      success: true, 
      message: '備份成功',
      backupPath 
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 列出所有備份
app.get('/api/backups', async (req, res) => {
  try {
    const backups = await listBackups();
    res.json({ 
      success: true, 
      data: backups 
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 轉換 Excel 為 PDF
app.post('/api/export-flowchart/pdf', async (req, res) => {
  let tempDir;
  let excelPath;
  let pdfPath;
  const cleanupTasks = [];

  try {
    const { fileName = 'flowchart', excelBase64 } = req.body || {};

    if (!excelBase64) {
      return res.status(400).json({ success: false, error: '缺少 excelBase64' });
    }

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'flowchart-'));
    const fileId = randomUUID();
    excelPath = path.join(tempDir, `${fileId}.xlsx`);
    pdfPath = path.join(tempDir, `${fileId}.pdf`);
    cleanupTasks.push(() => fs.rm(tempDir, { recursive: true, force: true }).catch(() => {}));

    const base64Payload = excelBase64.includes(',')
      ? excelBase64.split(',').pop()
      : excelBase64;

    const excelBuffer = Buffer.from(base64Payload, 'base64');
    if (excelBuffer.length === 0) {
      return res.status(400).json({ success: false, error: '收到的 Excel 檔案為空' });
    }

    await fs.writeFile(excelPath, excelBuffer);
    cleanupTasks.push(() => fs.unlink(excelPath).catch(() => {}));

    const sofficeBinary = process.env.LIBREOFFICE_BIN
      ? process.env.LIBREOFFICE_BIN
      : (process.platform === 'win32' ? 'soffice.exe' : 'soffice');

    try {
      console.log(`開始轉換 PDF: ${excelPath} -> ${pdfPath}`);
      await execFileAsync(sofficeBinary, [
        '--headless',
        '--nologo',
        '--convert-to',
        'pdf',
        '--outdir',
        tempDir,
        excelPath
      ], {
        timeout: 60000, // 60秒超時
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      // 等待一下確保文件寫入完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 檢查PDF文件是否存在
      try {
        await fs.access(pdfPath);
      } catch (accessError) {
        // 如果PDF文件不存在，檢查臨時目錄中的文件
        const files = await fs.readdir(tempDir);
        console.error('PDF文件不存在，臨時目錄中的文件:', files);
        throw new Error(`PDF 轉換失敗：未找到生成的 PDF 文件。LibreOffice 可能未正確安裝或轉換過程出錯。`);
      }
      
      console.log(`PDF 轉換成功: ${pdfPath}`);
    } catch (error) {
      console.error('LibreOffice convert error:', error);
      if (error.code === 'ENOENT') {
        throw new Error('LibreOffice 未安裝或無法找到 soffice 指令。請確認已安裝 LibreOffice 並可執行 soffice 指令。');
      } else if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
        throw new Error('PDF 轉換超時。請稍後再試或檢查 LibreOffice 是否正常運行。');
      } else {
        throw new Error(`LibreOffice 轉檔失敗: ${error.message || '請確認已安裝 LibreOffice 並可執行 soffice 指令'}`);
      }
    }

    cleanupTasks.push(() => fs.unlink(pdfPath).catch(() => {}));

    // 檢查PDF文件大小
    const pdfStats = await fs.stat(pdfPath);
    if (pdfStats.size === 0) {
      throw new Error('PDF 文件為空，轉換可能失敗');
    }
    
    const pdfBuffer = await fs.readFile(pdfPath);
    console.log(`PDF 文件大小: ${pdfBuffer.length} bytes`);
    const { fallback, original } = sanitizeFilename(fileName);
    const encoded = encodeURIComponent(original);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fallback}.pdf"; filename*=UTF-8''${encoded}.pdf`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('PDF export failed:', error);
    return res.status(500).json({ success: false, error: error.message || 'PDF 轉檔失敗' });
  } finally {
    await Promise.allSettled(cleanupTasks.map((task) => task()));
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log('✅ 服務器已就緒，可以處理 API 請求');
});

