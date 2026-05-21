const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { randomUUID } = require('crypto');
const Database = require('better-sqlite3');

const execFileAsync = promisify(execFile);

// ==================== 單一實例鎖定 ====================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // 如果無法獲得鎖,表示已有實例在運行,直接退出
    console.log('Application is already running. Exiting...');
    app.quit();
} else {
    // 當嘗試啟動第二個實例時,聚焦到第一個實例的窗口
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// 判斷是否為開發模式
const isDev = !app.isPackaged;

let mainWindow;
let serverApp;
let serverInstance;
let db;

// ==================== 日誌系統 ====================
function log(...args) {
    console.log('[Electron]', ...args);
    // 在生產環境中也寫入文件
    if (!isDev) {
        try {
            const logDir = path.join(app.getPath('userData'), 'logs');
            if (!fsSync.existsSync(logDir)) {
                fsSync.mkdirSync(logDir, { recursive: true });
            }
            const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
            const logMessage = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
            fsSync.appendFileSync(logFile, logMessage);
        } catch (e) {
            console.error('Failed to write log:', e);
        }
    }
}

// ==================== 錯誤處理 ====================
process.on('uncaughtException', (error) => {
    log('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    log('Unhandled Rejection:', error);
});

// ==================== 數據庫初始化 ====================
function initDatabase() {
    try {
        const userDataPath = app.getPath('userData');
        const dbDir = path.join(userDataPath, 'db');
        const dbPath = path.join(dbDir, 'flowcharts.db');
        const backupDir = path.join(dbDir, 'backups');

        log('User data path:', userDataPath);
        log('Database directory:', dbDir);

        // 確保目錄存在
        if (!fsSync.existsSync(dbDir)) {
            fsSync.mkdirSync(dbDir, { recursive: true });
            log('Created database directory');
        }
        if (!fsSync.existsSync(backupDir)) {
            fsSync.mkdirSync(backupDir, { recursive: true });
            log('Created backup directory');
        }

        log('Initializing database at:', dbPath);

        // 初始化數據庫
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');

        // 創建表
        db.exec(`
      CREATE TABLE IF NOT EXISTS flowcharts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 創建更新時間觸發器
        db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_flowcharts_timestamp 
      AFTER UPDATE ON flowcharts
      BEGIN
        UPDATE flowcharts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

        log('Database initialized successfully');

        return {
            dbPath,
            backupDir,
            db
        };
    } catch (error) {
        log('Database initialization error:', error);
        throw error;
    }
}

// ==================== 備份功能 ====================
let lastBackupTime = 0;
const BACKUP_COOLDOWN = 30000;

async function createBackup(reason, dbPath, backupDir) {
    const now = Date.now();
    if (now - lastBackupTime < BACKUP_COOLDOWN && reason === 'auto') {
        log(`⏭️  跳過備份（${reason}）- 距離上次備份未滿 30 秒`);
        return null;
    }

    lastBackupTime = now;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupPath = path.join(backupDir, `flowcharts_${reason}_${timestamp}.db`);

    try {
        await fs.copyFile(dbPath, backupPath);
        log(`✅ 備份成功: ${backupPath}`);
        return backupPath;
    } catch (error) {
        log('備份失敗:', error);
        throw error;
    }
}

// ==================== Express 服務器 ====================
function startServer(dbInfo) {
    try {
        const { db, dbPath, backupDir } = dbInfo;

        serverApp = express();
        const PORT = 3001;

        log('Starting Express server on port', PORT);

        // 準備語句
        const stmt = {
            getAll: db.prepare('SELECT * FROM flowcharts ORDER BY updated_at DESC'),
            getById: db.prepare('SELECT * FROM flowcharts WHERE id = ?'),
            search: db.prepare('SELECT * FROM flowcharts WHERE project_name LIKE ? ORDER BY updated_at DESC'),
            create: db.prepare('INSERT INTO flowcharts (project_name, data) VALUES (?, ?)'),
            update: db.prepare('UPDATE flowcharts SET project_name = ?, data = ? WHERE id = ?'),
            delete: db.prepare('DELETE FROM flowcharts WHERE id = ?')
        };

        const sanitizeFilename = (name = 'flowchart') => {
            const raw = String(name).trim() || 'flowchart';
            const fallback = raw.replace(/[\\/?%*:|"<>]/g, '_').replace(/[^\x20-\x7E]/g, '_');
            return {
                fallback: fallback || 'flowchart',
                original: raw
            };
        };

        // 異步備份
        function asyncBackup(reason) {
            setImmediate(async () => {
                try {
                    await createBackup(reason, dbPath, backupDir);
                } catch (error) {
                    log(`⚠️  異步備份失敗（${reason}）:`, error.message);
                }
            });
        }

        // Middleware
        serverApp.use(cors());
        serverApp.use(express.json({ limit: '25mb' }));

        // 請求日誌
        serverApp.use((req, res, next) => {
            log(`[API] ${req.method} ${req.path}`);
            next();
        });

        // ==================== API Routes ====================

        // 健康檢查
        serverApp.get('/api/health', (req, res) => {
            res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
        });

        // 取得所有檔案
        serverApp.get('/api/flowcharts', (req, res) => {
            try {
                const flowcharts = stmt.getAll.all();
                res.json({ success: true, data: flowcharts });
            } catch (error) {
                log('Error fetching flowcharts:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 搜尋檔案
        serverApp.get('/api/flowcharts/search', (req, res) => {
            try {
                const { q } = req.query;
                const searchTerm = `%${q}%`;
                const flowcharts = stmt.search.all(searchTerm);
                res.json({ success: true, data: flowcharts });
            } catch (error) {
                log('Error searching flowcharts:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 取得單一檔案
        serverApp.get('/api/flowcharts/:id', (req, res) => {
            try {
                const { id } = req.params;
                const flowchart = stmt.getById.get(id);

                if (!flowchart) {
                    return res.status(404).json({ success: false, error: 'Flowchart not found' });
                }

                res.json({ success: true, data: flowchart });
            } catch (error) {
                log('Error fetching flowchart:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 建立新檔案
        serverApp.post('/api/flowcharts', (req, res) => {
            try {
                const { project_name, data } = req.body;

                if (!project_name || !data) {
                    return res.status(400).json({ success: false, error: 'project_name and data are required' });
                }

                const result = stmt.create.run(project_name, JSON.stringify(data));
                asyncBackup('auto-create');

                res.json({ success: true, data: { id: result.lastInsertRowid, project_name, data } });
            } catch (error) {
                if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(409).json({ success: false, error: '系統存在同名檔案' });
                }
                log('Error creating flowchart:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 更新檔案
        serverApp.put('/api/flowcharts/:id', (req, res) => {
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

                asyncBackup('auto-update');

                res.json({ success: true, message: 'Flowchart updated successfully' });
            } catch (error) {
                if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(409).json({ success: false, error: '系統存在同名檔案' });
                }
                log('Error updating flowchart:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 刪除檔案
        serverApp.delete('/api/flowcharts/:id', (req, res) => {
            try {
                const { id } = req.params;
                const result = stmt.delete.run(id);

                if (result.changes === 0) {
                    return res.status(404).json({ success: false, error: 'Flowchart not found' });
                }

                res.json({ success: true, message: 'Flowchart deleted successfully' });
            } catch (error) {
                log('Error deleting flowchart:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 創建手動備份
        serverApp.post('/api/backup', async (req, res) => {
            try {
                const backupPath = await createBackup('manual', dbPath, backupDir);
                res.json({
                    success: true,
                    message: '備份成功',
                    backupPath
                });
            } catch (error) {
                log('Error creating backup:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 列出所有備份
        serverApp.get('/api/backups', async (req, res) => {
            try {
                const files = await fs.readdir(backupDir);
                const backups = files
                    .filter(f => f.endsWith('.db'))
                    .map(f => ({
                        filename: f,
                        path: path.join(backupDir, f)
                    }));
                res.json({
                    success: true,
                    data: backups
                });
            } catch (error) {
                log('Error listing backups:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // PDF 匯出 (需要 LibreOffice)
        serverApp.post('/api/export-flowchart/pdf', async (req, res) => {
            let tempDir;
            const cleanupTasks = [];

            try {
                const { fileName = 'flowchart', excelBase64 } = req.body || {};

                if (!excelBase64) {
                    return res.status(400).json({ success: false, error: '缺少 excelBase64' });
                }

                tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'flowchart-'));
                const fileId = randomUUID();
                const excelPath = path.join(tempDir, `${fileId}.xlsx`);
                const pdfPath = path.join(tempDir, `${fileId}.pdf`);
                cleanupTasks.push(() => fs.rm(tempDir, { recursive: true, force: true }).catch(() => { }));

                const base64Payload = excelBase64.includes(',')
                    ? excelBase64.split(',').pop()
                    : excelBase64;

                const excelBuffer = Buffer.from(base64Payload, 'base64');
                if (excelBuffer.length === 0) {
                    return res.status(400).json({ success: false, error: '收到的 Excel 檔案為空' });
                }

                await fs.writeFile(excelPath, excelBuffer);

                // Windows 上尋找 LibreOffice
                let sofficeBinary = 'soffice';
                if (process.platform === 'win32') {
                    const possiblePaths = [
                        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
                        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
                        path.join(process.resourcesPath, 'libreoffice', 'program', 'soffice.exe')
                    ];

                    for (const p of possiblePaths) {
                        try {
                            await fs.access(p);
                            sofficeBinary = p;
                            break;
                        } catch (e) {
                            // 繼續嘗試下一個路徑
                        }
                    }
                }

                try {
                    log(`開始轉換 PDF: ${excelPath} -> ${pdfPath}`);
                    await execFileAsync(sofficeBinary, [
                        '--headless',
                        '--nologo',
                        '--convert-to',
                        'pdf',
                        '--outdir',
                        tempDir,
                        excelPath
                    ], {
                        timeout: 60000,
                        maxBuffer: 10 * 1024 * 1024
                    });

                    await new Promise(resolve => setTimeout(resolve, 500));

                    try {
                        await fs.access(pdfPath);
                    } catch (accessError) {
                        const files = await fs.readdir(tempDir);
                        log('PDF文件不存在，臨時目錄中的文件:', files);
                        throw new Error(`PDF 轉換失敗：未找到生成的 PDF 文件。LibreOffice 可能未正確安裝或轉換過程出錯。`);
                    }

                    log(`PDF 轉換成功: ${pdfPath}`);
                } catch (error) {
                    log('LibreOffice convert error:', error);
                    if (error.code === 'ENOENT') {
                        throw new Error('LibreOffice 未安裝或無法找到 soffice 指令。請確認已安裝 LibreOffice 並可執行 soffice 指令。');
                    } else if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
                        throw new Error('PDF 轉換超時。請稍後再試或檢查 LibreOffice 是否正常運行。');
                    } else {
                        throw new Error(`LibreOffice 轉檔失敗: ${error.message || '請確認已安裝 LibreOffice 並可執行 soffice 指令'}`);
                    }
                }

                const pdfStats = await fs.stat(pdfPath);
                if (pdfStats.size === 0) {
                    throw new Error('PDF 文件為空，轉換可能失敗');
                }

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
                log('PDF export failed:', error);
                return res.status(500).json({ success: false, error: error.message || 'PDF 轉檔失敗' });
            } finally {
                await Promise.allSettled(cleanupTasks.map((task) => task()));
            }
        });

        // 啟動伺服器
        return new Promise((resolve, reject) => {
            try {
                serverInstance = serverApp.listen(PORT, () => {
                    log(`✅ 內部服務器運行於 http://localhost:${PORT}`);
                    resolve();
                });

                serverInstance.on('error', (error) => {
                    log('Server error:', error);
                    reject(error);
                });
            } catch (error) {
                log('Failed to start server:', error);
                reject(error);
            }
        });
    } catch (error) {
        log('Server initialization error:', error);
        throw error;
    }
}

// ==================== Electron 窗口 ====================
function createWindow() {
    try {
        log('Creating main window...');
        log('isDev:', isDev);
        log('__dirname:', __dirname);
        log('process.resourcesPath:', process.resourcesPath);
        log('app.getAppPath():', app.getAppPath());

        const preloadPath = isDev
            ? path.join(__dirname, 'preload.js')
            : path.join(__dirname, 'preload.js');

        log('Preload path:', preloadPath);
        log('Preload exists:', fsSync.existsSync(preloadPath));

        const iconPath = isDev
            ? path.join(__dirname, '../public/icon.ico')
            : path.join(process.resourcesPath, 'public/icon.ico');

        mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            icon: iconPath,
            autoHideMenuBar: true, // 自動隱藏菜單欄
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: preloadPath,
                devTools: true // 允許開啟開發者工具 (配合手動快捷鍵)
            },
            show: false // 先不顯示,等載入完成
        });

        // 移除菜單欄
        mainWindow.setMenuBarVisibility(false);
        mainWindow.setMenu(null);

        // 允許透過快捷鍵手動開關 DevTools (F12 或 Ctrl/Cmd + Shift + I)
        mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.type === 'keyDown') {
                const isF12 = input.key === 'F12';
                const isInspectShortcut = input.shift && input.key.toLowerCase() === 'i' && (input.control || input.meta);
                
                if (isF12 || isInspectShortcut) {
                    mainWindow.webContents.toggleDevTools();
                    event.preventDefault();
                }
            }
        });

        // 捕獲控制台訊息
        mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
            log(`[Console ${level}] ${message} (${sourceId}:${line})`);
        });

        // 窗口準備好後顯示並最大化
        mainWindow.once('ready-to-show', () => {
            log('Window ready to show');
            mainWindow.maximize(); // 最大化窗口
            mainWindow.show();
        });

        // 開發模式載入 Vite 開發服務器
        if (isDev) {
            log('Loading development URL: http://localhost:3000');
            mainWindow.loadURL('http://localhost:3000');
            mainWindow.webContents.openDevTools();
        } else {
            // 生產模式載入打包後的文件
            // 嘗試多個可能的路徑
            const possiblePaths = [
                path.join(__dirname, '../dist/index.html'),
                path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
                path.join(process.resourcesPath, 'dist', 'index.html'),
                path.join(app.getAppPath(), 'dist', 'index.html')
            ];

            log('Trying to find index.html in the following paths:');
            let indexPath = null;
            for (const p of possiblePaths) {
                log(`  - ${p} : ${fsSync.existsSync(p) ? 'EXISTS' : 'NOT FOUND'}`);
                if (fsSync.existsSync(p) && !indexPath) {
                    indexPath = p;
                }
            }

            if (indexPath) {
                log('Loading production file:', indexPath);
                mainWindow.loadFile(indexPath);
            } else {
                log('ERROR: index.html not found in any expected location!');
                log('Listing contents of __dirname:', __dirname);
                try {
                    const files = fsSync.readdirSync(__dirname);
                    log('Files in __dirname:', files);
                } catch (e) {
                    log('Cannot read __dirname:', e);
                }

                // 嘗試載入第一個路徑,即使不存在也讓錯誤更明確
                mainWindow.loadFile(possiblePaths[0]);
            }

            // 生產環境不自動打開開發者工具
        }

        // 監聽載入錯誤
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            log('Failed to load:', errorCode, errorDescription, validatedURL);
        });

        mainWindow.webContents.on('did-finish-load', () => {
            log('Page loaded successfully');
        });

        // 捕獲渲染進程錯誤
        mainWindow.webContents.on('render-process-gone', (event, details) => {
            log('Render process gone:', details);
        });

        mainWindow.on('closed', () => {
            log('Window closed');
            mainWindow = null;
        });

        log('Window created successfully');
    } catch (error) {
        log('Error creating window:', error);
        throw error;
    }
}


// ==================== App 生命週期 ====================
app.whenReady().then(async () => {
    try {
        log('🚀 Electron 應用啟動中...');
        log('App version:', app.getVersion());
        log('Electron version:', process.versions.electron);
        log('Node version:', process.versions.node);
        log('Platform:', process.platform);
        log('Is packaged:', app.isPackaged);
        log('App path:', app.getAppPath());
        log('User data path:', app.getPath('userData'));

        // 初始化數據庫
        log('Initializing database...');
        const dbInfo = initDatabase();

        // 啟動內部服務器
        log('Starting server...');
        await startServer(dbInfo);

        // 創建窗口
        log('Creating window...');
        createWindow();

        log('✅ Application started successfully');

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    } catch (error) {
        log('Failed to start application:', error);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    log('All windows closed');
    if (process.platform !== 'darwin') {
        // 關閉數據庫
        if (db) {
            try {
                db.close();
                log('Database closed');
            } catch (e) {
                log('Error closing database:', e);
            }
        }
        // 關閉服務器
        if (serverInstance) {
            try {
                serverInstance.close();
                log('Server closed');
            } catch (e) {
                log('Error closing server:', e);
            }
        }
        app.quit();
    }
});

app.on('before-quit', () => {
    log('App quitting...');
    // 關閉數據庫
    if (db) {
        try {
            db.close();
            log('Database closed on quit');
        } catch (e) {
            log('Error closing database on quit:', e);
        }
    }
    // 關閉服務器
    if (serverInstance) {
        try {
            serverInstance.close();
            log('Server closed on quit');
        } catch (e) {
            log('Error closing server on quit:', e);
        }
    }
});

// ==================== IPC 處理 ====================
ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.filePaths[0];
});

ipcMain.handle('select-file', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result.filePaths;
});

ipcMain.handle('save-file', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result.filePath;
});
