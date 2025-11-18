// 备用路由处理：如果 [id].js 不工作，可以使用这个文件
// 需要在 vercel.json 中配置路由重写
import { getStatements } from './db-utils.js';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 从 URL 路径中解析 id
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const idIndex = pathParts.indexOf('flowcharts') + 1;
    const id = pathParts[idIndex];

    console.log('Request URL:', req.url);
    console.log('Path parts:', pathParts);
    console.log('Extracted id:', id);

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing id parameter',
        debug: {
          url: req.url,
          pathname: url.pathname,
          pathParts: pathParts
        }
      });
    }

    const stmt = getStatements();

    if (req.method === 'GET') {
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

