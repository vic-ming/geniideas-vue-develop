// 测试 API 端点，用于验证数据库连接
import { getDatabase } from '../server/db/database.js';

export default async function handler(req, res) {
  try {
    const { db, stmt } = getDatabase();
    
    // 测试查询
    const testResult = stmt.getAll.all();
    
    return res.json({ 
      success: true, 
      message: '数据库连接成功',
      count: testResult.length,
      environment: process.env.VERCEL ? 'Vercel' : 'Local'
    });
  } catch (error) {
    console.error('Test API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

