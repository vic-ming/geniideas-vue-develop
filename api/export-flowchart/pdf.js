import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const execFileAsync = promisify(execFile);

const sanitizeFilename = (name = 'flowchart') => {
  const raw = String(name).trim() || 'flowchart';
  const fallback = raw.replace(/[\\/?%*:|"<>]/g, '_').replace(/[^\x20-\x7E]/g, '_');
  return {
    fallback: fallback || 'flowchart',
    original: raw
  };
};

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let tempDir;
  let excelPath;
  let pdfPath;
  const cleanupTasks = [];

  try {
    const { fileName = 'flowchart', excelBase64 } = req.body || {};

    if (!excelBase64) {
      return res.status(400).json({ success: false, error: '缺少 excelBase64' });
    }

    // 在 Vercel 环境中，使用 /tmp 目录
    const isVercel = process.env.VERCEL === '1';
    const baseTempDir = isVercel ? '/tmp' : os.tmpdir();
    tempDir = await fs.mkdtemp(path.join(baseTempDir, 'flowchart-'));
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

    // 在 Vercel 环境中，LibreOffice 可能不可用
    // 这里返回一个错误提示，或者可以考虑使用其他 PDF 生成方案
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
      // 在 Vercel 环境中，LibreOffice 不可用，返回错误
      if (process.env.VERCEL === '1') {
        return res.status(503).json({ 
          success: false, 
          error: 'PDF 轉換功能在 Vercel 環境中不可用。請考慮使用客戶端 PDF 生成方案。' 
        });
      }
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
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'PDF 轉檔失敗' 
    });
  } finally {
    await Promise.allSettled(cleanupTasks.map((task) => task()));
  }
}

