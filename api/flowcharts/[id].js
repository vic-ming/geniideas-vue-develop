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
    // Vercel 的动态路由参数在 req.query 中，参数名就是文件名中方括号内的名称
    // 对于 [id].js，参数应该是 req.query.id
    let id = req.query.id;
    
    // 调试日志（生产环境可以移除）
    console.log('Request URL:', req.url);
    console.log('Request query:', req.query);
    console.log('Extracted id:', id);
    
    // 如果 query 中没有 id，尝试从 URL 路径解析
    if (!id && req.url) {
      const match = req.url.match(/\/flowcharts\/(\d+)/);
      if (match) {
        id = match[1];
        console.log('Extracted id from URL:', id);
      }
    }
    
    // 如果还是没有 id，返回错误
    if (!id) {
      console.error('Missing id parameter. URL:', req.url, 'Query:', req.query);
      return res.status(400).json({ 
        success: false, 
        error: 'Missing id parameter',
        debug: {
          url: req.url,
          query: req.query
        }
      });
    }
    
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

