<template>
  <svg class="connection-lines" :style="svgStyle">
    <g v-for="connection in connections" :key="connection.id">
      <!-- 連接線 -->
      <path
        :d="getConnectionPath(connection)"
        stroke="#999"
        stroke-width="2"
        fill="none"
      />
      
      <!-- 起點圓點 (只在非向下的連接線顯示) -->
      <circle
        v-if="connection.to.y <= connection.from.y"
        :cx="connection.from.x"
        :cy="connection.from.y"
        r="5"
        fill="#999"
      />
      
      <!-- 終點圓點 -->
      <circle
        :cx="connection.to.x"
        :cy="connection.to.y"
        r="5"
        fill="#999"
      />
      
      <g 
        v-if="connection.showAdditionalIcon !== false"
        class="clickable-icon"
        :transform="`translate(${getAdditionalIconPosition(connection).x}, ${getAdditionalIconPosition(connection).y})`"
        @click="handleAdditionalIconClick(connection)"
      >
        <image
          href="../assets/images/additional-button.svg"
          x="-16"
          y="-16"
          width="32"
          height="32"
          class="additional-icon"
        />
      </g>
      
      
      <g 
        v-if="connection.showFaIcon !== false"
        class="clickable-icon"
        :transform="`translate(${getFaIconPosition(connection).x}, ${getFaIconPosition(connection).y})`"
        @click="handleFaIconClick(connection)"
      >
        <image
          href="../assets/images/fa.svg"
          x="-25"
          y="-16"
          width="50"
          height="33"
          class="fa-icon"
        />
      </g>
    </g>
  </svg>
</template>

<script>
export default {
  name: 'ConnectionLine',
  props: {
    connections: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    svgStyle() {
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto', // 改為 auto 以允許點擊事件
        zIndex: 1
      }
    }
  },
  methods: {
    // 生成直角連接路徑
    getConnectionPath(connection) {
      const from = connection.from
      const to = connection.to
      
      // 檢查是否是分支連接線（分支源頭資訊或分支閥件或額外設備）
      // 分支源頭資訊連接線的特徵：起始點在紫色icon左側，結束點在分支卡片右側
      // 分支閥件連接線的特徵：從閥件右側連接到分支閥件左側
      // 額外設備連接線的特徵：從 panel 與 equipment 之間連接到額外設備左側
      const isBranchConnection = connection.isBranchSource || 
        connection.isBranchValve ||
        connection.isAdditionalEquipment ||
        (from.x < to.x && Math.abs(from.y - to.y) > 100); // 分支連接線通常有較大的Y軸差異
      
      if (isBranchConnection) {
        // 分支連接線：先垂直向下，再水平向右
        // 確保垂直線延伸到目標Y位置，然後水平連接到目標X位置
        return `M ${from.x} ${from.y} L ${from.x} ${to.y} L ${to.x} ${to.y}`
      }
      
      // 標準連接線：先水平移動，再垂直移動
      const midY = from.y + (to.y - from.y) * 1
      return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`
    },
    
    // 計算加號圖標位置（在連接線的水平段上）
    getAdditionalIconPosition(connection) {
      const from = connection.from
      const to = connection.to
      
      // 計算轉折點
      const midX = from.x + (to.x - from.x) * 0.9
      
      // 加號位置在水平段上
      const iconX = from.x + (midX - from.x) * 0.33
      const iconY = from.y
      
      return { x: iconX, y: iconY }
    },
    
    // 計算紫色圖標位置
    getFaIconPosition(connection) {
      const from = connection.from
      const to = connection.to
      
      // 檢查是否是額外設備卡片連接線（直角連接線）
      if (connection.isAdditionalEquipment) {
        // 額外設備卡片的紫色icon在垂直段上，靠近設備卡片左側
        const iconX = from.x + 38
        const iconY = from.y + (to.y - from.y)
        return { x: iconX, y: iconY }
      }
      
      // 計算轉折點
      const midX = from.x + (to.x - from.x) * 0.67
      
      if (connection.showAdditionalIcon !== false) {
        // 紫色圖標在垂直段上
        const iconX = midX
        const iconY = from.y + (to.y - from.y) * 0.67
        return { x: iconX, y: iconY }
      } else {
        // 加號位置在水平段上
        const iconX = from.x + (midX - from.x) * 0.76
        const iconY = from.y
        return { x: iconX, y: iconY }
      }
    },
    
    
    // 處理加號圖標點擊事件
    handleAdditionalIconClick(connection) {
      console.log('加號被點擊:', connection)
      this.$emit('additional-icon-click', connection)
    },
    
    // 處理紫色圖標點擊事件
    handleFaIconClick(connection) {
      console.log('閥件被點擊:', connection)
      this.$emit('fa-icon-click', connection)
    }
  }
}
</script>

<style scoped>
.connection-lines {
  overflow: visible;
}

.clickable-icon {
  cursor: pointer;
  /* transition: transform 0.2s ease; */
}


.additional-icon,
.fa-icon {
  transition: opacity 0.2s ease;
}

.clickable-icon:hover .additional-icon,
.clickable-icon:hover .fa-icon {
  opacity: 0.8;
}
</style>
