import express from 'express';
import cors from 'cors';
import { stmt } from './db/database.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

