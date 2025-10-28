<template>
  <div class="floor-info-card" :style="cardStyle" @mousedown.stop>
    <div class="card-header">
      <div class="card-icon">
        <img src="@/assets/images/type-c.svg" alt="floor-info" />
      </div>
      <h3 class="card-title">樓層資訊</h3>
    </div>
    
    <div class="card-content">
      <div class="info-item">
        <label class="info-label">源頭樓層</label>
        <select class="info-select" :class="{ empty: !floorData.sourceFloor }" v-model="floorData.sourceFloor">
          <option value="">請選擇源頭樓層</option>
          <option value="1F">1F</option>
          <option value="2F">2F</option>
          <option value="3F">3F</option>
          <option value="4F">4F</option>
          <option value="5F">5F</option>
          <option value="6F">6F</option>
          <option value="7F">7F</option>
          <option value="8F">8F</option>
          <option value="B1F">B1F</option>
          <option value="B2F">B2F</option>
          <option value="B3F">B3F</option>


        </select>
      </div>
      
      <div class="info-item">
        <label class="info-label">設備樓層</label>
        <select class="info-select" :class="{ empty: !floorData.equipmentFloor }" v-model="floorData.equipmentFloor">
          <option value="">請選擇設備樓層</option>
          <option value="1F">1F</option>
          <option value="2F">2F</option>
          <option value="3F">3F</option>
          <option value="4F">4F</option>
          <option value="5F">5F</option>
          <option value="6F">6F</option>
          <option value="7F">7F</option>
          <option value="8F">8F</option>
          <option value="B1F">B1F</option>
          <option value="B2F">B2F</option>
          <option value="B3F">B3F</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FloorInfoCard',
  props: {
    initialPosition: {
      type: Object,
      default: () => ({ x: 800, y: 100 })
    },
    cardData: {
      type: Object,
      default: () => ({
        sourceFloor: '',
        equipmentFloor: ''
      })
    }
  },
  data() {
    return {
      showMenu: false
    }
  },
  computed: {
    floorData() {
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
    floorData: {
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

.floor-info-card {
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
</style>

