<template>
  <div class="equipment-info-card" :style="cardStyle" @mousedown.stop>
    <div class="card-header">
      <div class="card-icon">
        <img src="@/assets/images/type-e.svg" alt="equipment-info" />
      </div>
      <h3 class="card-title">設備資訊</h3>
    </div>
    
    <div class="card-content">
      <div class="info-item">
        <label class="info-label">氣體別</label>
        <select class="info-select" :class="{ empty: !equipmentData.gasType }" v-model="equipmentData.gasType">
          <option value="">請選擇氣體別</option>
          <option v-for="gasType in $constants.gasTypes" :key="gasType" :value="gasType">{{ gasType }}</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">尺寸</label>
        <select class="info-select" :class="{ empty: !equipmentData.size }" v-model="equipmentData.size">
          <option value="">請選擇尺寸</option>
          <option v-for="size in $constants.equipmentSizes" :key="size" :value="size">{{ size }}</option> 


        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">接頭</label>
        <select class="info-select" :class="{ empty: !equipmentData.connector }" v-model="equipmentData.connector">
          <option value="">請選擇接頭</option>
          <option v-for="spec in $constants.connectorSpecs" :key="spec" :value="spec">{{ spec }}</option>
          <option value="快速接頭">快速接頭</option>
        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">設備接點名稱</label>
        <textarea 
          class="info-textarea" 
          v-model="equipmentData.connectionName"
          placeholder="請輸入設備接點名稱"
          rows="3"
          maxlength="50"
        ></textarea>
      </div>
      
      <div class="info-item">
        <label class="info-label">三合一</label>
        <select class="info-select" :class="{ empty: !equipmentData.threeInOne }" v-model="equipmentData.threeInOne">
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
    cardData: {
      type: Object,
      default: () => ({
        gasType: '',
        size: '',
        connector: '',
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
    cardStyle() {
      return {
        position: 'absolute',
        left: `${this.initialPosition.x}px`,
        top: `${this.initialPosition.y}px`
      }
    }
  },
  watch: {
    equipmentData: {
      handler(newVal) {
        this.$emit('update-data', newVal);
      },
      deep: true
    }
  },
  methods: {
    toggleMenu() {
      this.showMenu = !this.showMenu;
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
  resize: vertical;
  min-height: 60px;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #A3A3A3;
  }
}
</style>

