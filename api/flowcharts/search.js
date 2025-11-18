import { getStatements } from '../db-utils.js';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { q } = req.query;
    const searchTerm = `%${q}%`;
    const stmt = getStatements();
    const flowcharts = stmt.search.all(searchTerm);

    return res.status(200).json({ success: true, data: flowcharts });
  } catch (error) {
    console.error('Error searching flowcharts:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}

