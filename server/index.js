import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import { stmt } from './db/database.js';

const app = express();
const PORT = 3001;
const execFileAsync = promisify(execFile);

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

// ==================== API Routes ====================

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
      await execFileAsync(sofficeBinary, [
        '--headless',
        '--nologo',
        '--convert-to',
        'pdf',
        '--outdir',
        tempDir,
        excelPath
      ]);
    } catch (error) {
      console.error('LibreOffice convert error:', error);
      throw new Error('LibreOffice 轉檔失敗，請確認已安裝 LibreOffice 並可執行 soffice 指令');
    }

    cleanupTasks.push(() => fs.unlink(pdfPath).catch(() => {}));

    const pdfBuffer = await fs.readFile(pdfPath);
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
});

