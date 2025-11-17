# 卡片欄位儲存/讀取驗證報告

## 執行時間
2025-11-17

## 驗證目標
確認所有卡片的欄位都能夠正常地被儲存和讀取

## 驗證方法
1. 檢查所有卡片組件的欄位定義
2. 檢查 App.vue 中的儲存/讀取邏輯
3. 檢查所有卡片創建方法中的默認數據結構
4. 比對組件欄位與數據結構的一致性

---

## 儲存/讀取機制分析

### 儲存機制 (`getCurrentData`)
```javascript
getCurrentData() {
  return {
    allModuleSets: this.allModuleSets,
    settings: this.settings,
    pageBreaks: this.pageBreaks
  };
}
```
**結論**: 直接將 `allModuleSets` 序列化為 JSON 儲存，所有卡片數據都包含在內。

### 讀取機制 (`executeLoad`)
```javascript
executeLoad(loadData) {
  if (loadData && loadData.data && loadData.data.allModuleSets) {
    this.allModuleSets = loadData.data.allModuleSets;
    // ...
  }
}
```
**結論**: 直接從 JSON 解析並賦值給 `allModuleSets`，完整還原所有卡片數據。

### 更新機制
所有卡片的更新方法（如 `updateCardData`, `updateValveData` 等）都是直接將傳入的完整 data 物件賦值：
```javascript
this.allModuleSets[setIndex][cardType].data = data;
```
**結論**: 整個 data 物件都會被更新，包括所有欄位。

---

## 卡片欄位驗證結果

### 1. SourceInfoCard（源頭資訊卡片）✅

#### 組件定義欄位
- `title` (標題) - String
- `pipelineType` (管線類別) - String, 必填
- `gasType` (氣體別) - String, 必填
- `valveNumber` (閥件編號) - String, 必填
- `sourceSize` (源頭尺寸) - String, 必填
- `doubleSleeveSize` (雙套管尺寸) - String, 條件必填
- `connectorSpec` (接頭規格) - String, 必填
- `locationInfo` (位置資訊) - String
- `heatInsulation` (保溫加熱) - Boolean

#### 創建方法數據結構 (`createNewModuleSet`)
```javascript
source: {
  data: {
    title: '',
    pipelineType: defaultPipelineType,
    gasType: '',
    valveNumber: '',
    sourceSize: '',
    doubleSleeveSize: '',
    connectorSpec: 'WELD',
    locationInfo: '',
    heatInsulation: false
  }
}
```

**✅ 驗證通過**: 所有欄位完全匹配

---

### 2. BranchSourceInfoCard（分支源頭資訊卡片）✅

#### 組件定義欄位
與 SourceInfoCard 相同

#### 創建方法數據結構 (`createBranchSourceCard`)
```javascript
{
  data: {
    title: '',
    pipelineType: '',
    gasType: '',
    valveNumber: '',
    sourceSize: '',
    doubleSleeveSize: '',
    connectorSpec: 'WELD',
    locationInfo: '',
    heatInsulation: false
  }
}
```

**✅ 驗證通過**: 所有欄位完全匹配

---

### 3. ValveInfoCard（閥件資訊卡片）✅

#### 組件定義欄位
- `connectorType` (閥件接頭形式) - String, 必填
- `size` (閥件尺寸) - String, 必填
- `valveType` (閥件種類) - String, 必填
- `enableValve` (是否啟用後方區塊) - Boolean (僅分支閥件)
- `branchSize` (連結分支尺寸) - String (僅分支閥件)
- `backPipelineType` (後方管線類別) - String, 必填

#### 創建方法數據結構 (`createValveCard`)
```javascript
{
  data: {
    connectorType: '',
    size: '',
    valveType: '',
    enableValve: false,
    branchSize: '',
    backPipelineType: '單套管'
  }
}
```

**✅ 驗證通過**: 所有欄位完全匹配

---

### 4. PipelineInfoCard（管線資訊卡片）✅

#### 組件定義欄位
- `length` (管線長度) - String, 必填
- `material` (管線材質) - String, 必填

#### 創建方法數據結構 (`createNewModuleSet`)
```javascript
pipeline: {
  data: {
    length: '',
    material: 'NA'
  }
}
```

**✅ 驗證通過**: 所有欄位完全匹配

---

### 5. FloorInfoCard（樓層資訊卡片）✅

#### 組件定義欄位
- `sourceFloor` (源頭樓層) - String, 必填
- `equipmentFloor` (設備樓層) - String, 必填

#### 創建方法數據結構 (`createNewModuleSet`)
```javascript
floor: {
  data: {
    sourceFloor: '1F',
    equipmentFloor: '1F'
  }
}
```

**✅ 驗證通過**: 所有欄位完全匹配

---

### 6. PanelInfoCard（盤面卡片）✅

#### 組件定義欄位
- `enablePanel` (是否啟用盤面) - Boolean
- `valve` (Valve) - String, 必填
- `size` (尺寸) - String, 必填
- `valveConnector` (Valve接頭) - String, 必填
- `regulator` (Regulator) - Boolean
- `pressureGauge` (壓力錶錶頭) - String, 必填 (當regulator為true時)
- `backPipelineType` (後方管線類別) - String, 必填

#### 創建方法數據結構 (`createNewModuleSet`)
```javascript
panel: {
  data: {
    enablePanel: true,
    valve: '',
    size: '',
    valveConnector: '',
    regulator: false,
    pressureGauge: 'none',
    backPipelineType: defaultPipelineType
  }
}
```

**✅ 驗證通過**: 所有欄位完全匹配

---

### 7. EquipmentInfoCard（設備資訊卡片）✅

#### 組件定義欄位
- `gasType` (氣體別) - String, 必填
- `size` (尺寸) - String, 必填
- `connector` (接頭) - String, 必填
- `connectionName` (設備接點名稱) - String
- `threeInOne` (三合一) - String, 必填

#### 創建方法數據結構 (`createNewModuleSet`)
```javascript
equipment: {
  data: {
    gasType: '',
    size: '',
    connector: 'WELD',
    connectionName: '',
    threeInOne: ''
  }
}
```

**✅ 驗證通過**: 所有欄位完全匹配

---

## 特殊情況驗證

### 8. 分支模組中的 Panel 和 Equipment ✅

#### 創建方法 (`createBranchPanelEquipmentGroup`)
```javascript
panel: {
  data: {
    enablePanel: true,
    valve: '',
    size: '',
    valveConnector: '',
    regulator: false,
    pressureGauge: 'none',
    backPipelineType: sourcePipelineType
  }
},
equipment: {
  data: {
    gasType: '',
    size: '',
    connector: 'WELD',
    connectionName: '',
    threeInOne: ''
  }
}
```

**✅ 驗證通過**: 與主分支的 Panel 和 Equipment 數據結構完全一致

---

### 9. 額外設備卡片 ✅

#### 創建方法 (`addEquipmentCard`)
```javascript
{
  data: {
    gasType: '',
    size: '',
    connector: 'WELD',
    connectionName: '',
    threeInOne: ''
  }
}
```

**✅ 驗證通過**: 與主設備卡片數據結構完全一致

---

### 10. Panel-Equipment 閥件 ✅

#### 創建方法 (`addValveBetweenPanelAndEquipment`)
```javascript
valve: {
  data: {
    connectorType: '',
    size: '',
    valveType: '',
    enableValve: false,
    branchSize: '',
    backPipelineType: panel.data.backPipelineType || '單套管'
  }
}
```

**✅ 驗證通過**: 與普通閥件數據結構完全一致

---

### 11. 分支閥件模組 ✅

#### 創建方法 (位於 `addBranchValveCard` 中的創建邏輯)
分支閥件模組包含：
- 閥件 (valve): 與普通閥件相同
- 管線 (pipeline): 與主管線相同
- 樓層 (floor): 與主樓層相同
- Panel 和 Equipment 群組: 與主分支相同

**✅ 驗證通過**: 所有子卡片的數據結構都與對應的主卡片一致

---

## 更新方法驗證

所有卡片都有對應的更新方法，並且都使用相同的模式：

### 主要更新方法列表
- `updateCardData(setIndex, cardType, data)` - 源頭、管線、樓層
- `updateValveData(setIndex, valveIndex, data)` - 閥件
- `updatePanelData(setIndex, groupIndex, data)` - Panel
- `updateEquipmentData(setIndex, groupIndex, data)` - Equipment
- `updateBranchValveData(setIndex, branchModuleIndex, data)` - 分支閥件
- `updateBranchPipelineData(setIndex, branchModuleIndex, data)` - 分支管線
- `updateBranchFloorData(setIndex, branchModuleIndex, data)` - 分支樓層
- `updateBranchPanelData(setIndex, branchModuleIndex, groupIndex, data)` - 分支Panel
- `updateBranchEquipmentData(setIndex, branchModuleIndex, groupIndex, data)` - 分支Equipment

### 更新模式
所有更新方法都使用直接賦值的方式：
```javascript
this.allModuleSets[setIndex][...].data = data;
```

**✅ 驗證通過**: 整個 data 物件被完整更新，所有欄位都會被保存

---

## 總結

### ✅ 驗證通過項目
1. **所有 7 種基本卡片**的欄位定義與數據結構完全一致
2. **分支模組中的卡片**使用相同的數據結構
3. **額外設備卡片**使用相同的數據結構
4. **Panel-Equipment 閥件**使用相同的數據結構
5. **儲存機制**直接序列化整個 `allModuleSets`
6. **讀取機制**完整還原 `allModuleSets`
7. **更新機制**完整更新整個 data 物件

### 🎯 結論

**所有卡片的欄位都能夠正常地被儲存和讀取。**

系統採用完整的數據序列化方式，確保：
- 創建時：所有欄位都有默認值
- 更新時：完整的 data 物件被更新
- 儲存時：完整的 allModuleSets 被序列化
- 讀取時：完整的 allModuleSets 被還原

不存在欄位遺漏或數據丟失的問題。

---

## 建議

### 可選的改進措施（目前系統正常運作）
1. **類型檢查**: 可以考慮使用 TypeScript 來提供更強的類型安全性
2. **數據驗證**: 在儲存前可以增加數據驗證邏輯，確保必填欄位不為空
3. **版本控制**: 可以在數據結構中加入版本號，方便未來升級

這些建議是可選的改進，當前系統已經能夠正常儲存和讀取所有欄位。


