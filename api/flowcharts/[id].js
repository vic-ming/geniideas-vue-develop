import { stmt } from '../../server/db/database.js';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, query } = req;
  const id = query.id;

  try {
    // 确保数据库已初始化
    const statements = stmt;
    
    switch (method) {
      case 'GET':
        // 取得單一檔案
        const flowchart = statements.getById.get(id);
        if (!flowchart) {
          return res.status(404).json({ success: false, error: 'Flowchart not found' });
        }
        return res.json({ success: true, data: flowchart });

      case 'PUT':
        // 更新檔案
        const { project_name, data } = req.body;
        if (!project_name || !data) {
          return res.status(400).json({ success: false, error: 'project_name and data are required' });
        }
        const updateResult = statements.update.run(project_name, JSON.stringify(data), id);
        if (updateResult.changes === 0) {
          return res.status(404).json({ success: false, error: 'Flowchart not found' });
        }
        return res.json({ success: true, message: 'Flowchart updated successfully' });

      case 'DELETE':
        // 刪除檔案
        const deleteResult = statements.delete.run(id);
        if (deleteResult.changes === 0) {
          return res.status(404).json({ success: false, error: 'Flowchart not found' });
        }
        return res.json({ success: true, message: 'Flowchart deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    
    // 如果是数据库初始化错误
    if (error.message && error.message.includes('better-sqlite3')) {
      return res.status(500).json({ 
        success: false, 
        error: '数据库初始化失败，请检查服务器日志' 
      });
    }
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, error: '系統存在同名檔案' });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || '服务器内部错误' 
    });
  }
}

