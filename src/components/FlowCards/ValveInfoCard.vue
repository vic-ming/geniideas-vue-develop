<template>
  <div class="valve-info-card" :style="cardStyle" @mousedown.stop>
    <div class="card-header">
      <div class="card-icon">
        <img src="@/assets/images/type-f.svg" alt="valve-info" />
      </div>
      <h3 class="card-title"> {{ (isBranchModule && !isPanelEquipmentValve) ? '分支閥件資訊' : '閥件資訊' }}  </h3>
      <img 
        @click="canDelete && !isDeleteDisabled ? handleDeleteButtonClick() : null" 
        src="@/assets/images/delete.svg" 
        alt="delete" 
        :class="['clickable-icon', { 'disabled': isDeleteDisabled || !canDelete }]"
      />
    </div>
    
    <div class="card-content">
      <div v-if="isBranchModule && !isPanelEquipmentValve" class="info-item toggle-item">
        <label class="info-label">是否啟用後方區塊</label>
        <label class="toggle-switch">
          <input 
            type="checkbox" 
            v-model="cardData.enableValve"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div v-if="isBranchModule && !isPanelEquipmentValve" class="info-item">
        <label class="info-label">連結分支尺寸<span class="required">*</span></label>
        <select 
          :key="`branchSize-${cardData.branchSize || ''}`"
          class="info-select" 
          :class="{ empty: cardData.branchSize === '' }" 
          v-model="cardData.branchSize"
          @change="handleDataChange"
        >
          <option value="">請選擇連結分支尺寸</option>
          <option v-for="size in $constants.sourceSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>

      <div class="info-item">
        <label class="info-label">{{ (isBranchModule && !isPanelEquipmentValve) ? '分支閥件接頭形式' : '閥件接頭形式' }}<span class="required">*</span></label>
        <select 
          :key="`connectorType-${cardData.connectorType || ''}`"
          class="info-select" 
          :class="{ empty: cardData.connectorType === '' }" 
          v-model="cardData.connectorType"
          @change="handleDataChange"
        >
          <option value="">{{ (isBranchModule && !isPanelEquipmentValve) ? '請輸入分支閥件接頭形式' : '請輸入閥件接頭形式' }}</option>
         <option v-for="connectorType in $constants.connectorSpecs" :key="connectorType" :value="connectorType">{{ connectorType }}</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">{{ (isBranchModule && !isPanelEquipmentValve) ? '分支閥件尺寸' : '閥件尺寸' }}<span class="required">*</span></label>
        <select 
          :key="`size-${cardData.size || ''}`"
          class="info-select" 
          :class="{ empty: cardData.size === '' }" 
          v-model="cardData.size"
          @change="handleDataChange"
        >
          <option value="">{{ (isBranchModule && !isPanelEquipmentValve) ? '請輸入分支閥件尺寸' : '請輸入閥件尺寸' }}</option>
          <option v-for="size in $constants.sourceSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">{{ (isBranchModule && !isPanelEquipmentValve) ? '分支閥件種類' : '閥件種類' }}<span class="required">*</span></label>
        <select 
          :key="`valveType-${cardData.valveType || ''}`"
          class="info-select" 
          :class="{ empty: cardData.valveType === '' }" 
          v-model="cardData.valveType"
          @change="handleDataChange"
        >
          <option value="">{{ (isBranchModule && !isPanelEquipmentValve) ? '請輸入分支閥件種類' : '請輸入閥件種類' }}</option>
          <option v-for="valveType in $constants.valveTypes" :key="valveType" :value="valveType">{{ valveType }}</option>
        </select>
      </div>

      <div v-if="isPanelEquipmentValve" class="info-item">
        <label class="info-label">後方管線類別<span class="required">*</span></label>
        <select 
          :key="`backPipelineType-${cardData.backPipelineType || ''}`"
          class="info-select" 
          :class="{ empty: cardData.backPipelineType === '' }" 
          v-model="cardData.backPipelineType"
          @change="handleBackPipelineTypeChange"
        >
          <option value="">請選擇後方管線類別</option>
          <option v-for="pipelineType in $constants.pipelineTypes" :key="pipelineType" :value="pipelineType">{{ pipelineType }}</option>
        </select>
      </div>

      
    </div>
  </div>
</template>

<script>
export default {
  name: 'ValveInfoCard',
  props: {
    initialPosition: {
      type: Object,
      default: () => ({ x: 100, y: 100 })
    },
    canDelete: {
      type: Boolean,
      default: true
    },
    isDeleteDisabled: {
      type: Boolean,
      default: false
    },
    isBranchModule: {
      type: Boolean,
      default: false
    },
    isPanelEquipmentValve: {
      type: Boolean,
      default: false
    },
    branchModuleIndex: {
      type: Number,
      default: undefined
    },
    moduleSetIndex: {
      type: Number,
      default: undefined
    },
    panelBackPipelineType: {
      type: String,
      default: ''
    },
    cardData: {
      type: Object,
      default: () => ({
        connectorType: '',
        size: '',
        valveType: '',
        enableValve: false,
        branchSize: '',
        backPipelineType: '單套管'
      })
    }
  },
  data() {
    return {
      showMenu: false,
      previousBackPipelineType: '',
      isSyncingFromPanel: false
    }
  },
  mounted() {
    // 初始化 previousBackPipelineType
    if (this.isPanelEquipmentValve) {
      this.previousBackPipelineType = this.cardData.backPipelineType || this.panelBackPipelineType;
    }
  },
  computed: {
    valveData() {
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
    cardData: {
      handler(newVal) {
        this.$emit('update-data', newVal);
      },
      deep: true,
      immediate: true
    },
    panelBackPipelineType: {
      handler(newVal, oldVal) {
        // 只有当设备阀件且从 Panel 同步时才自动更新
        if (this.isPanelEquipmentValve && newVal && newVal !== oldVal && !this.isSyncingFromPanel) {
          this.isSyncingFromPanel = true;
          this.previousBackPipelineType = this.cardData.backPipelineType;
          this.cardData.backPipelineType = newVal;
          this.$nextTick(() => {
            this.isSyncingFromPanel = false;
            this.$emit('update-data', this.cardData);
          });
        }
      },
      immediate: false
    }
  },
  methods: {
    handleDataChange() {
      // 通用数据变化处理，直接更新数据
      this.$emit('update-data', this.cardData);
      this.$forceUpdate();
    },
    handleBackPipelineTypeChange() {
      // 专门处理"后方管线类别"变化
      
      // 如果是从 Panel 同步更新，直接更新数据，不触发确认窗口
      if (this.isSyncingFromPanel) {
        this.previousBackPipelineType = this.cardData.backPipelineType;
        this.$emit('update-data', this.cardData);
        this.$forceUpdate();
        return;
      }

      // 只有当是设备阀件且后方管线类别有值且与 Panel 不同时才弹出确认窗口
      if (this.isPanelEquipmentValve && 
          this.panelBackPipelineType && 
          this.cardData.backPipelineType && 
          this.cardData.backPipelineType !== '' &&
          this.cardData.backPipelineType !== this.panelBackPipelineType) {
        // 保存之前的值
        const oldValue = this.previousBackPipelineType || this.panelBackPipelineType;
        this.previousBackPipelineType = this.cardData.backPipelineType;
        // 发出事件，请求显示确认窗口
        this.$emit('back-pipeline-type-change', {
          newValue: this.cardData.backPipelineType,
          panelValue: this.panelBackPipelineType,
          oldValue: oldValue,
          cardData: { ...this.cardData }
        });
      } else {
        // 相同或 Panel 为空，直接更新
        this.previousBackPipelineType = this.cardData.backPipelineType;
        this.$emit('update-data', this.cardData);
        this.$forceUpdate();
      }
    },
    handleDeleteButtonClick() {
      console.log('閥件資訊卡片刪除按鈕被點擊');
      this.$emit('delete-valve', {
        type: this.isPanelEquipmentValve ? 'panel-equipment-valve' : (this.isBranchModule ? 'branch-valve' : 'valve'),
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

.valve-info-card {
  width: 232px;
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  overflow: hidden;
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
  padding: 0 16px 20px;
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

.clickable-icon {
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &.disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
}

.clickable-icon:hover:not(.disabled) {
  opacity: 0.8;
}

.clickable-icon:active:not(.disabled) {
  transform: scale(0.95);
}

.toggle-item {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + .toggle-slider {
      background-color: #3F8009;
      
      &:before {
        transform: translateX(20px);
      }
    }
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #D4D4D4;
  transition: 0.3s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
}
</style>