import { getStatements } from '../db-utils.js';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;
    const stmt = getStatements();

    if (req.method === 'GET') {
      // 获取单个流程图
      const flowchart = stmt.getById.get(id);

      if (!flowchart) {
        return res.status(404).json({ 
          success: false, 
          error: 'Flowchart not found' 
        });
      }

      return res.status(200).json({ success: true, data: flowchart });
    }

    if (req.method === 'PUT') {
      // 更新流程图
      const { project_name, data } = req.body;

      if (!project_name || !data) {
        return res.status(400).json({ 
          success: false, 
          error: 'project_name and data are required' 
        });
      }

      try {
        const result = stmt.update.run(project_name, JSON.stringify(data), id);

        if (result.changes === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Flowchart not found' 
          });
        }

        return res.status(200).json({ 
          success: true, 
          message: 'Flowchart updated successfully' 
        });
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(409).json({ 
            success: false, 
            error: '系統存在同名檔案' 
          });
        }
        throw error;
      }
    }

    if (req.method === 'DELETE') {
      // 删除流程图
      const result = stmt.delete.run(id);

      if (result.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Flowchart not found' 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Flowchart deleted successfully' 
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in flowchart API:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}

