// 使用 Postgres 版本（支持持久化存储）
import { getStatements } from '../db-utils-postgres.js';

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
    
    // 确保 ID 是数字类型（SQLite INTEGER）
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid id parameter. Must be a number.' 
      });
    }

    console.log('Querying database with id:', numericId, '(type:', typeof numericId, ')');
    
    const stmt = await getStatements();

    if (req.method === 'GET') {
      // 获取单个流程图
      const flowchart = await stmt.getById(numericId);
      
      console.log('Query result:', flowchart ? 'Found' : 'Not found');

      if (!flowchart) {
        // 添加调试信息：列出所有记录的 ID
        const allFlowcharts = await stmt.getAll();
        const allIds = allFlowcharts.map(f => f.id);
        console.log('Available flowchart IDs:', allIds);
        
        return res.status(404).json({ 
          success: false, 
          error: 'Flowchart not found',
          debug: {
            requestedId: numericId,
            availableIds: allIds,
            totalCount: allFlowcharts.length
          }
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
        const result = await stmt.update(project_name, JSON.stringify(data), numericId);

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
        // PostgreSQL 唯一约束错误
        if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
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
      const result = await stmt.delete(numericId);

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

