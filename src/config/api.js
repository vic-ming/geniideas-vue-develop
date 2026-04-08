// API 配置
// 在 Electron 環境中使用完整 URL,在瀏覽器環境中使用相對路徑

const isElectron = window.electronAPI?.isElectron || false;

export const API_BASE_URL = isElectron ? 'http://localhost:3001' : '';

// 輔助函數:構建完整的 API URL
export function getApiUrl(path) {
    return `${API_BASE_URL}${path}`;
}

// 輔助函數:發送 API 請求
export async function apiRequest(path, options = {}) {
    const url = getApiUrl(path);
    const response = await fetch(url, options);
    return response;
}

export default {
    API_BASE_URL,
    getApiUrl,
    apiRequest
};
