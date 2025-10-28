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
