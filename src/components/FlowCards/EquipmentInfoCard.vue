<template>
  <div class="equipment-info-card" :style="cardStyle" @mousedown.stop>
    <div class="card-header">
      <div class="card-icon">
        <img src="@/assets/images/type-e.svg" alt="equipment-info" />
      </div>
      <h3 class="card-title">設備資訊</h3>
      <img 
        v-if="canDelete"
        @click="handleDeleteButtonClick" 
        src="@/assets/images/delete.svg" 
        alt="delete" 
        class="clickable-icon"
      />
    </div>
    
    <div class="card-content">
      <div class="info-item">
        <label class="info-label">氣體別<span class="required">*</span></label>
        <select 
          :key="`gasType-${cardData.gasType || ''}`"
          class="info-select" 
          :class="{ empty: cardData.gasType === '' }" 
          v-model="cardData.gasType"
          @change="handleDataChange"
        >
          <option value="">請選擇氣體別</option>
          <option v-for="gasType in $constants.gasTypes" :key="gasType" :value="gasType">{{ gasType }}</option>
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
          <option v-for="size in $constants.equipmentSizes" :key="size" :value="size">{{ size }}</option> 


        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">接頭<span class="required">*</span></label>
        <select 
          :key="`connector-${cardData.connector || ''}`"
          class="info-select" 
          :class="{ empty: cardData.connector === '' }" 
          v-model="cardData.connector"
          @change="handleDataChange"
        >
          <option value="">請選擇接頭</option>
          <option v-for="spec in $constants.connectorSpecs" :key="spec" :value="spec">{{ spec }}</option>
          <option value="快速接頭">快速接頭</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">設備接點名稱</label>
        <textarea 
          class="info-textarea" 
          v-model="cardData.connectionName"
          @keydown="handleConnectionNameKeydown"
          @paste="handleConnectionNamePaste"
          @input="handleConnectionNameInput"
          placeholder="請輸入設備接點名稱"
          rows="3"
          maxlength="50"
        ></textarea>
      </div>
      
      <div class="info-item">
        <label class="info-label">三合一<span class="required">*</span></label>
        <select 
          :key="`threeInOne-${cardData.threeInOne || ''}`"
          class="info-select" 
          :class="{ empty: cardData.threeInOne === '' }" 
          v-model="cardData.threeInOne"
          @change="handleDataChange"
        >
          <option value="">請選擇三合一</option>
          <option value="無">無</option>
          <option value="三合一新增">三合一新增</option>
          <option value="三合一修改">三合一修改</option>


        </select>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EquipmentInfoCard',
  props: {
    initialPosition: {
      type: Object,
      default: () => ({ x: 1140, y: 100 })
    },
    canDelete: {
      type: Boolean,
      default: false
    },
    cardData: {
      type: Object,
      default: () => ({
        gasType: '',
        size: '',
        connector: 'WELD',
        connectionName: '',
        threeInOne: ''
      })
    }
  },
  data() {
    return {
      showMenu: false
    }
  },
  computed: {
    equipmentData() {
      return this.cardData;
    },
    isEmptyGasType() {
      const val = this.cardData.gasType;
      return val === '' || val === null || val === undefined;
    },
    isEmptySize() {
      const val = this.cardData.size;
      return val === '' || val === null || val === undefined;
    },
    isEmptyConnector() {
      const val = this.cardData.connector;
      return val === '' || val === null || val === undefined;
    },
    isEmptyThreeInOne() {
      const val = this.cardData.threeInOne;
      return val === '' || val === null || val === undefined;
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
    handleConnectionNameKeydown(event) {
      // 如果按下 Enter 鍵，檢查是否已經有2個換行符（即3行）
      if (event.key === 'Enter') {
        const currentValue = event.target.value;
        const lineBreaks = (currentValue.match(/\n/g) || []).length;
        
        // 如果已經有2個換行符（即3行），阻止輸入
        if (lineBreaks >= 2) {
          event.preventDefault();
          return false;
        }
      }
    },
    handleConnectionNamePaste(event) {
      // 延遲處理，讓粘貼內容先插入
      setTimeout(() => {
        const value = event.target.value;
        const lineBreaks = (value.match(/\n/g) || []).length;
        
        // 如果超過2個換行符（即超過3行），則截斷到前3行
        if (lineBreaks > 2) {
          const lines = value.split('\n');
          const limitedValue = lines.slice(0, 3).join('\n');
          this.cardData.connectionName = limitedValue;
          event.target.value = limitedValue;
        }
      }, 0);
    },
    handleConnectionNameInput(event) {
      const value = event.target.value;
      // 計算換行符的數量（\n）
      const lineBreaks = (value.match(/\n/g) || []).length;
      
      // 如果超過2個換行符（即超過3行），則截斷到前3行
      if (lineBreaks > 2) {
        const lines = value.split('\n');
        const limitedValue = lines.slice(0, 3).join('\n');
        // 立即更新值，防止超過3行
        this.cardData.connectionName = limitedValue;
        // 強制更新 textarea 的值
        this.$nextTick(() => {
          if (event.target.value !== limitedValue) {
            event.target.value = limitedValue;
          }
        });
      }
    },
    handleDeleteButtonClick() {
      console.log('刪除設備卡片按鈕被點擊');
      this.$emit('delete-equipment-card', {
        type: 'equipment-card',
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

.equipment-info-card {
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

.info-textarea {
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
  resize: none;
  min-height: 60px;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #A3A3A3;
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

