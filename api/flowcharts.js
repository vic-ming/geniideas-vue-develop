// 使用 Postgres 版本（支持持久化存储）
import { getStatements } from './db-utils-postgres.js';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const stmt = await getStatements();

    if (req.method === 'GET') {
      // 获取所有流程图
      const flowcharts = await stmt.getAll();
      return res.status(200).json({ success: true, data: flowcharts });
    }

    if (req.method === 'POST') {
      // 创建新流程图
      const { project_name, data } = req.body;

      if (!project_name || !data) {
        return res.status(400).json({ 
          success: false, 
          error: 'project_name and data are required' 
        });
      }

      try {
        const result = await stmt.create(project_name, JSON.stringify(data));
        return res.status(200).json({ 
          success: true, 
          data: { id: result.lastInsertRowid, project_name, data } 
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

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in flowcharts API:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}

