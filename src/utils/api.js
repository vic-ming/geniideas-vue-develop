// API 基础 URL 配置
// 在开发环境使用 Vite 代理，在生产环境使用相对路径
const API_BASE_URL = '/api';

export const api = {
  // 获取所有流程图
  getAllFlowcharts: () => fetch(`${API_BASE_URL}/flowcharts`).then(res => res.json()),
  
  // 搜索流程图
  searchFlowcharts: (query) => fetch(`${API_BASE_URL}/flowcharts/search?q=${encodeURIComponent(query)}`).then(res => res.json()),
  
  // 获取单个流程图
  getFlowchart: (id) => fetch(`${API_BASE_URL}/flowcharts/${id}`).then(res => res.json()),
  
  // 创建流程图
  createFlowchart: (project_name, data) => 
    fetch(`${API_BASE_URL}/flowcharts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_name, data })
    }).then(res => res.json()),
  
  // 更新流程图
  updateFlowchart: (id, project_name, data) => 
    fetch(`${API_BASE_URL}/flowcharts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_name, data })
    }).then(res => res.json()),
  
  // 删除流程图
  deleteFlowchart: (id) => 
    fetch(`${API_BASE_URL}/flowcharts/${id}`, {
      method: 'DELETE'
    }).then(res => res.json())
};

