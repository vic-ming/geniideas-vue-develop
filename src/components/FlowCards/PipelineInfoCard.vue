<template>
  <div class="pipeline-info-card" :style="cardStyle" @mousedown.stop>
    <div class="card-header">
      <div class="card-icon">
        <img src="@/assets/images/type-b.svg" alt="pipeline-info" />
      </div>
      <h3 class="card-title">管線資訊</h3>
    </div>
    
    <div class="card-content">
      <div class="info-item">
        <label class="info-label">管線長度</label>
        <input 
          type="text" 
          class="info-input" 
          v-model="pipelineData.length"
          placeholder="請輸入管線長度"
          maxlength="4"
          @input="handleLengthInput"
        />
      </div>
      
      <div class="info-item">
        <label class="info-label">管線材質</label>
        <select class="info-select" :class="{ empty: !pipelineData.material }" v-model="pipelineData.material">
          <option value="">請選擇管線材質</option>
          <option v-for="material in $constants.pipelineMaterials" :key="material" :value="material">{{ material }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PipelineInfoCard',
  props: {
    initialPosition: {
      type: Object,
      default: () => ({ x: 450, y: 100 })
    },
    cardData: {
      type: Object,
      default: () => ({
        length: '',
        material: 'NA'
      })
    }
  },
  data() {
    return {
      showMenu: false
    }
  },
  computed: {
    pipelineData() {
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
    pipelineData: {
      handler(newVal) {
        this.$emit('update-data', newVal);
      },
      deep: true
    }
  },
  methods: {
    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
    handleLengthInput(event) {
      // 只允許輸入數字
      let value = event.target.value.replace(/[^0-9]/g, '')
      this.pipelineData.length = value
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.pipeline-info-card {
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
</style>

