<template>
  <div class="source-info-card" :style="cardStyle" @mousedown.stop>
    <div class="card-header">
      <div class="card-icon">
        <img src="@/assets/images/type-a.svg" alt="source-info" />
      </div>
      <h3 class="card-title">分支源頭資訊</h3>
     <img 
       @click="canDelete ? handleDeleteButtonClick() : null" 
       src="@/assets/images/delete.svg" 
       alt="delete" 
       :class="['clickable-icon', { 'disabled': !canDelete }]"
     />
    </div>
    
    <div class="card-content">
      <div class="info-item">
        <label class="info-label">標題</label>
        <input 
          type="text" 
          class="info-input" 
          v-model="sourceData.title"
          placeholder="請輸入標題"
          maxlength="50"
        />
      </div>
      
      <div class="info-item">
        <label class="info-label">管線類別</label>
        <select class="info-select" :class="{ empty: !sourceData.pipelineType }" v-model="sourceData.pipelineType">
          <option value="">請選擇管線類別</option>
          <option v-for="type in $constants.pipelineTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">氣體別<span class="required">*</span></label>
        <select class="info-select" :class="{ empty: !sourceData.gasType }" v-model="sourceData.gasType">
          <option value="">請選擇氣體別</option>
          <option v-for="gasType in $constants.gasTypes" :key="gasType" :value="gasType">{{ gasType }}</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">閥件編號<span class="required">*</span></label>
        <input 
          type="text" 
          class="info-input" 
          v-model="sourceData.valveNumber"
          placeholder="請輸入閥件編號"
          maxlength="35"
        />
      </div>
      
      <div class="info-item">
        <label class="info-label">源頭尺寸<span class="required">*</span></label>
        <select class="info-select" :class="{ empty: !sourceData.sourceSize }" v-model="sourceData.sourceSize">
          <option value="">請選擇源頭尺寸</option>
          <option v-for="sourceSize in $constants.sourceSizes" :key="sourceSize" :value="sourceSize">{{ sourceSize }}</option>
        </select>
      </div>
      
      <div v-if="sourceData.pipelineType === '雙套管'" class="info-item">
        <label class="info-label">雙套管尺寸<span class="required">*</span></label>
        <select class="info-select" :class="{ empty: !sourceData.doubleSleeveSize }" v-model="sourceData.doubleSleeveSize">
          <option value="">請選擇雙套管尺寸</option>
          <option v-for="size in $constants.doubleSleeveSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">接頭規格<span class="required">*</span></label>
        <select class="info-select" :class="{ empty: !sourceData.connectorSpec }" v-model="sourceData.connectorSpec">
          <option value="">請選擇接頭規格</option>
          <option v-for="spec in $constants.connectorSpecs" :key="spec" :value="spec">{{ spec }}</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">位置資訊</label>
        <input 
          type="text" 
          class="info-input" 
          v-model="sourceData.locationInfo"
          placeholder="請輸入位置資訊"
          maxlength="35"
        />
      </div>
      
      <div class="info-item checkbox-item">
        <label class="checkbox-label">
         
          <span>保溫加熱</span>
          <input 
            type="checkbox" 
            class="info-checkbox" 
            v-model="sourceData.heatInsulation"
          />
        </label>
      </div>
    </div>
    <!-- 注意：分支源頭資訊卡片沒有 card-footer，因此沒有分支和新增按鈕 -->
  </div>
</template>

<script>
export default {
  name: 'BranchSourceInfoCard',
  props: {
    initialPosition: {
      type: Object,
      default: () => ({ x: 100, y: 100 })
    },
    canDelete: {
      type: Boolean,
      default: true
    },
    cardData: {
      type: Object,
      default: () => ({
        title: '',
        pipelineType: '',
        gasType: '',
        valveNumber: '',
        sourceSize: '',
        doubleSleeveSize: '',
        connectorSpec: 'WELD',
        locationInfo: '',
        heatInsulation: false
      })
    }
  },
  data() {
    return {
      showMenu: false
    }
  },
  computed: {
    sourceData() {
      return this.cardData;
    },
    cardStyle() {
      return {
        position: 'absolute',
        left: `${this.initialPosition.x}px`,
        top: `${this.initialPosition.y}px`
      }
    }
  },
  watch: {
    sourceData: {
      handler(newVal) {
        this.$emit('update-data', newVal);
      },
      deep: true
    }
  },
  methods: {
    handleDeleteButtonClick() {
      console.log('刪除分支源頭資訊按鈕被點擊');
      this.$emit('delete-branch-source', {
        type: 'branch-source',
        position: {
          x: this.initialPosition.x,
          y: this.initialPosition.y
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.source-info-card {
  width: 232px;
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  // overflow: hidden;
  position: relative;
  border: 1px solid #e1e5e9;
  z-index: 10;
}

.card-header {
  display: flex;
  align-items: center;
  padding: 13px 16px;
  color: #171717;
  gap: $spacing-sm;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.card-title {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.card-content {
  padding: 0 16px 25px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 14px;
  font-weight: 500;
  color: #737373;
  .required {
    color: #FF0000;
  }
}

.info-input {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  color: #171717;
  background: #F5F5F5;
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #A3A3A3;
  }
}

.info-select {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  color: #171717;
  background: #F5F5F5 url('@/assets/images/chevron-down.svg') no-repeat right 12px center;
  background-size: 16px;
  padding-right: 32px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  
  &:focus {
    outline: none;
  }
  
  &.empty {
    color: #A3A3A3;
  }
}

.checkbox-item {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #737373;
}

.info-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  border: 2px solid #D4D4D4;
  border-radius: 3px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  outline: none;
  transition: all 0.2s ease;
  position: relative;
  
  &:checked {
    background-color: #3F8009;
    border-color: #3F8009;
    
    &::after {
      content: '';
      position: absolute;
      left: 4px;
      top: 1px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }
  
  &:hover {
    border-color: #999;
  }
}

.clickable-icon {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.clickable-icon:hover {
  opacity: 0.8;
}

.clickable-icon:active {
  transform: scale(0.95);
}

.clickable-icon.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.clickable-icon.disabled:hover {
  opacity: 0.3;
  transform: none;
}
</style>
