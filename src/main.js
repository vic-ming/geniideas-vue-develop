import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/main.scss'
import './assets/styles/layout.scss'

// 導入常量
import gasTypes from './assets/const/gasTypes.json'
import sourceSizes from './assets/const/sourceSizes.json'
import pipelineTypes from './assets/const/pipelineTypes.json'
import doubleSleeveSizes from './assets/const/doubleSleeveSizes.json'
import connectorSpecs from './assets/const/connectorSpecs.json'
import valveTypes from './assets/const/valveTypes.json'
import pipelineMaterials from './assets/const/pipelineMaterials.json'
import equipmentSizes from './assets/const/equipmentSizes.json'

// ==================== Electron API 配置 ====================
// 檢測是否在 Electron 環境中
const isElectron = window.electronAPI?.isElectron || false;
const API_BASE_URL = isElectron ? 'http://localhost:3001' : '';

console.log('[API Config] isElectron:', isElectron);
console.log('[API Config] API_BASE_URL:', API_BASE_URL);

// 攔截 fetch 請求,自動添加 API 基礎 URL
if (isElectron) {
  const originalFetch = window.fetch;
  window.fetch = function (url, options) {
    // 如果是相對路徑且以 /api/ 開頭,添加基礎 URL
    if (typeof url === 'string' && url.startsWith('/api/')) {
      const fullUrl = `${API_BASE_URL}${url}`;
      console.log(`[Fetch Interceptor] ${url} -> ${fullUrl}`);
      return originalFetch(fullUrl, options);
    }
    // 否則使用原始 URL
    return originalFetch(url, options);
  };
  console.log('[Fetch Interceptor] Installed');
}

const app = createApp(App)

// 將常量添加到全局屬性
app.config.globalProperties.$constants = {
  gasTypes,
  sourceSizes,
  pipelineTypes,
  doubleSleeveSizes,
  connectorSpecs,
  valveTypes,
  pipelineMaterials,
  equipmentSizes

}

app.mount('#app')
