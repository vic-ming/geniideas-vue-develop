import { stmt } from '../server/db/database.js';

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

  const { method, query, body } = req;

  try {
    // 确保数据库已初始化
    const statements = stmt;
    
    switch (method) {
      case 'GET':
        // 搜尋檔案
        if (query.q) {
          const searchTerm = `%${query.q}%`;
          const flowcharts = statements.search.all(searchTerm);
          return res.json({ success: true, data: flowcharts });
        }
        
        // 取得所有檔案列表
        const flowcharts = statements.getAll.all();
        return res.json({ success: true, data: flowcharts });

      case 'POST':
        // 建立新檔案
        const { project_name, data } = body;
        if (!project_name || !data) {
          return res.status(400).json({ success: false, error: 'project_name and data are required' });
        }
        const result = statements.create.run(project_name, JSON.stringify(data));
        return res.json({ success: true, data: { id: result.lastInsertRowid, project_name, data } });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
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

