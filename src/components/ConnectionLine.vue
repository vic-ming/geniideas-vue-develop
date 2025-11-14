<template>
  <svg class="connection-lines" :style="svgStyle">
    <g v-for="connection in connections" :key="connection.id">
      <!-- 雙套管：雙線 -->
      <template v-if="connection.pipelineType === '雙套管'">
        <path
          :d="getConnectionPath(connection, -3)"
          stroke="#999"
          stroke-width="2"
          fill="none"
        />
        <path
          :d="getConnectionPath(connection, 3)"
          stroke="#999"
          stroke-width="2"
          fill="none"
        />
      </template>
      
      <!-- 軟管：波浪線 -->
      <template v-else-if="connection.pipelineType === '軟管'">
        <path
          :d="getWavyPath(connection)"
          stroke="#999"
          stroke-width="2"
          fill="none"
        />
      </template>
      
      <!-- 單套管：單線（默認） -->
      <template v-else>
        <path
          :d="getConnectionPath(connection)"
          stroke="#999"
          stroke-width="2"
          fill="none"
        />
      </template>
      
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
    // 生成直角連接路徑（支持平行線偏移）
    getConnectionPath(connection, offset = 0) {
      const from = connection.from
      const to = connection.to
      
      // 檢查是否是分支連接線（分支源頭資訊或分支閥件或額外設備）
      const isBranchConnection = connection.isBranchSource || 
        connection.isBranchValve ||
        connection.isAdditionalEquipment ||
        (from.x < to.x && Math.abs(from.y - to.y) > 100);
      
      if (isBranchConnection) {
        // 分支連接線：先垂直向下，再水平向右
        // 對於垂直線使用 X 軸偏移，水平線使用 Y 軸偏移
        if (offset !== 0) {
          return `M ${from.x + offset} ${from.y} L ${from.x + offset} ${to.y - offset} L ${to.x} ${to.y - offset}`
        }
        return `M ${from.x} ${from.y} L ${from.x} ${to.y} L ${to.x} ${to.y}`
      }
      
      // 標準連接線：先水平移動，再垂直移動
      const midY = from.y + (to.y - from.y) * 1
      if (offset !== 0) {
        // 水平線使用 Y 軸偏移
        return `M ${from.x} ${from.y + offset} L ${from.x} ${midY + offset} L ${to.x} ${midY + offset} L ${to.x} ${to.y + offset}`
      }
      return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`
    },
    
    // 生成波浪線路徑（軟管）
    getWavyPath(connection) {
      const from = connection.from
      const to = connection.to
      
      const isBranchConnection = connection.isBranchSource || 
        connection.isBranchValve ||
        connection.isAdditionalEquipment ||
        (from.x < to.x && Math.abs(from.y - to.y) > 100);
      
      if (isBranchConnection) {
        // 分支連接線：先垂直波浪，再水平波浪
        const verticalDistance = Math.abs(to.y - from.y)
        const horizontalDistance = Math.abs(to.x - from.x)
        const waveAmplitude = 8 // 波浪幅度
        const waveFrequency = 20 // 波浪頻率（每20px一個波）
        
        let path = `M ${from.x} ${from.y}`
        
        // 垂直波浪段
        if (verticalDistance > 0) {
          const verticalWaves = Math.floor(verticalDistance / waveFrequency)
          for (let i = 0; i < verticalWaves; i++) {
            const y1 = from.y + (i * 2 + 1) * waveFrequency / 2
            const y2 = from.y + (i + 1) * waveFrequency
            const xOffset = (i % 2 === 0) ? waveAmplitude : -waveAmplitude
            path += ` Q ${from.x + xOffset} ${y1}, ${from.x} ${y2}`
          }
          // 連接到轉角
          if (verticalDistance % waveFrequency !== 0) {
            path += ` L ${from.x} ${to.y}`
          }
        }
        
        // 水平波浪段
        if (horizontalDistance > 0) {
          const horizontalWaves = Math.floor(horizontalDistance / waveFrequency)
          const startX = from.x
          for (let i = 0; i < horizontalWaves; i++) {
            const x1 = startX + (i * 2 + 1) * waveFrequency / 2
            const x2 = startX + (i + 1) * waveFrequency
            const yOffset = (i % 2 === 0) ? waveAmplitude : -waveAmplitude
            path += ` Q ${x1} ${to.y + yOffset}, ${x2} ${to.y}`
          }
          // 連接到終點
          if (horizontalDistance % waveFrequency !== 0) {
            path += ` L ${to.x} ${to.y}`
          }
        }
        
        return path
      }
      
      // 標準連接線的波浪
      const distance = Math.abs(to.x - from.x)
      const waveAmplitude = 8
      const waveFrequency = 20
      const waves = Math.floor(distance / waveFrequency)
      
      let path = `M ${from.x} ${from.y}`
      
      for (let i = 0; i < waves; i++) {
        const x1 = from.x + (i * 2 + 1) * waveFrequency / 2
        const x2 = from.x + (i + 1) * waveFrequency
        const yOffset = (i % 2 === 0) ? waveAmplitude : -waveAmplitude
        path += ` Q ${x1} ${from.y + yOffset}, ${x2} ${from.y}`
      }
      
      // 連接剩餘部分
      if (distance % waveFrequency !== 0) {
        path += ` L ${to.x} ${from.y}`
      }
      
      // 垂直部分（如果有）
      if (to.y !== from.y) {
        path += ` L ${to.x} ${to.y}`
      }
      
      return path
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
