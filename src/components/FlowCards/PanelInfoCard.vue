<template>
  <div class="panel-info-card" :style="cardStyle" @mousedown.stop>
    <div class="card-header">
      <div class="card-icon">
        <img src="@/assets/images/type-d.svg" alt="panel-info" />
      </div>
      <h3 class="card-title">盤面</h3>
      <img 
        v-if="canDelete"
        @click="handleDeleteButtonClick" 
        src="@/assets/images/delete.svg" 
        alt="delete" 
        class="clickable-icon"
      />
    </div>
    
    <div class="card-content">
      <div class="info-item toggle-item">
        <label class="info-label">是否啟用盤面</label>
        <label class="toggle-switch">
          <input 
            type="checkbox" 
            v-model="cardData.enablePanel"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      
      <div class="info-item">
        <label class="info-label">Valve<span class="required">*</span></label>
        <select 
          :key="`valve-${cardData.valve || ''}`"
          class="info-select" 
          :class="{ empty: cardData.valve === '' }" 
          v-model="cardData.valve"
          @change="handleDataChange"
        >
          <option value="">請選擇Valve</option>
          <option v-for="valveType in $constants.valveTypes" :key="valveType" :value="valveType">{{ valveType }}</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">尺寸<span class="required">*</span></label>
        <select 
          :key="`size-${cardData.size || ''}`"
          class="info-select" 
          :class="{ empty: cardData.size === '' }" 
          v-model="cardData.size"
          @change="handleDataChange"
        >
          <option value="">請選擇尺寸</option>
          <option v-for="size in $constants.sourceSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">Valve接頭<span class="required">*</span></label>
        <select 
          :key="`valveConnector-${cardData.valveConnector || ''}`"
          class="info-select" 
          :class="{ empty: cardData.valveConnector === '' }" 
          v-model="cardData.valveConnector"
          @change="handleDataChange"
        >
          <option value="">請選擇Valve接頭</option>
          <option value="SWG">SWG</option>
          <option value="VCR-M">VCR-M</option>
          <option value="VCR-F">VCR-F</option>
        </select>
      </div>
      
      <div class="info-item checkbox-item">
        <label class="checkbox-label">
          
          <span>Regulator</span>
          <input 
            type="checkbox" 
            class="info-checkbox" 
            v-model="cardData.regulator"
          />
        </label>
      </div>
      
      <div class="info-item">
        <label class="info-label">壓力錶錶頭<span class="required">*</span></label>
        <select 
          :key="`pressureGauge-${cardData.pressureGauge || ''}`"
          class="info-select" 
          :class="{ empty: cardData.pressureGauge === '' || !cardData.pressureGauge }" 
          v-model="cardData.pressureGauge"
          @change="handleDataChange"
        >
          <option value="none">無</option>
          <option value="Gauge">Gauge</option>
          <option value="eSensor">eSensor</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">後方管線類別<span class="required">*</span></label>
        <select 
          :key="`backPipelineType-${cardData.backPipelineType || ''}`"
          class="info-select" 
          :class="{ empty: cardData.backPipelineType === '' }" 
          v-model="cardData.backPipelineType"
          @change="handleDataChange"
        >
          <option value="">請選擇管線類別</option>
          <option v-for="pipelineType in $constants.pipelineTypes" :key="pipelineType" :value="pipelineType">{{ pipelineType }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PanelInfoCard',
  props: {
    initialPosition: {
      type: Object,
      default: () => ({ x: 880, y: 100 })
    },
    canDelete: {
      type: Boolean,
      default: false
    },
    cardData: {
      type: Object,
      default: () => ({
        enablePanel: true,
        valve: '',
        size: '',
        valveConnector: '',
        regulator: false,
        pressureGauge: 'none',
        backPipelineType: ''
      })
    }
  },
  data() {
    return {
      showMenu: false
    }
  },
  computed: {
    panelData() {
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
    }
  },
  methods: {
    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
    handleDataChange() {
      this.$emit('update-data', this.cardData);
      this.$forceUpdate();
    },
    handleDeleteButtonClick() {
      console.log('刪除盤面卡片按鈕被點擊');
      this.$emit('delete-panel-group', {
        type: 'panel-group',
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

.panel-info-card {
  width: 232px;
  background: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  overflow: hidden;
  border: 1px solid #e1e5e9;
  z-index: 10;
  position: relative;
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
  width: 20px;
  height: 20px;
}

.clickable-icon:hover {
  opacity: 0.8;
}

.clickable-icon:active {
  transform: scale(0.95);
}
</style>

