<template>
  <div v-if="isVisible" class="popup-overlay" @click="handleOverlayClick">
    <div class="popup-container" @click.stop>
      <!-- Popup Header -->
      <div v-if="title" class="popup-header">
        <h3 class="popup-title">{{ title }}</h3>
        <button class="popup-close" @click="close">
          <span>&times;</span>
        </button>
      </div>
      
      <!-- Divider -->
      <div v-if="title" class="popup-divider"></div>
      
      <!-- 警告圖標 -->
     
      <!-- 訊息內容 -->
      <div class="popup-content">
        <div v-if="showIcon && !title" class="popup-icon">
          <div class="warning-icon">
            <span class="exclamation-mark">!</span>
          </div>
        </div>
      
        <p class="popup-message" v-html="message"></p>
      </div>
      
      <!-- 按鈕區域 -->
      <div class="popup-buttons">
        <button
          v-for="(button, index) in buttons"
          :key="index"
          :class="['popup-button', button.class || 'default']"
          @click="handleButtonClick(button, index)"
        >
          {{ button.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Popup',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    buttons: {
      type: Array,
      default: () => [
        {
          text: '確定',
          class: 'primary',
          action: 'confirm'
        }
      ]
    },
    showIcon: {
      type: Boolean,
      default: true
    },
    closeOnOverlay: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isVisible: false
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(newVal) {
        this.isVisible = newVal
      }
    }
  },
  methods: {
    handleButtonClick(button, index) {
      // 執行按鈕的動作
      if (button.action && typeof button.action === 'function') {
        button.action()
      } else if (button.action === 'confirm' || button.action === 'ok') {
        this.close()
      } else if (button.action === 'cancel') {
        this.close()
      }
      
      // 發送事件給父組件
      this.$emit('button-click', {
        button,
        index,
        action: button.action
      })
      
      // 如果沒有自訂動作且不是取消按鈕，則關閉 popup
      if (!button.action || button.action === 'confirm' || button.action === 'ok') {
        this.close()
      }
    },
    
    handleOverlayClick() {
      if (this.closeOnOverlay) {
        this.close()
      }
    },
    
    close() {
      this.isVisible = false
      this.$emit('close')
    },
    
    // 公開方法：顯示 popup
    show() {
      this.isVisible = true
    },
    
    // 公開方法：隱藏 popup
    hide() {
      this.isVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(74, 74, 74, 0.17);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; // 確保在畫布縮放功能之上
  
}

.popup-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.34);
  max-width: 520px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: popup-enter 0.2s ease-out;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
  color: #171717;
  margin: 0;
}

.popup-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: color 0.2s ease;
  
  &:hover {
    color: #171717;
  }
  
  &:focus {
    outline: none;
  }
  
  span {
    line-height: 1;
  }
}

.popup-divider {
  height: 1px;
  background-color: #E5E7EB;
  margin: 0 24px;
}

@keyframes popup-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.popup-icon {
  display: flex;
  justify-content: center;
}

.warning-icon {
  width: 14px;
  height: 14px;
  background-color: #DB2777;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.exclamation-mark {
  color: white;
  font-size: 8px;
  font-weight: bold;
  line-height: 1;
}

.popup-content {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.popup-message {
  font-size: 16px;
  line-height: 1.5;
  color: #171717;
  margin: 0;
  word-wrap: break-word;
}

.popup-buttons {
  display: flex;
  gap: 10px;
  padding: 0 24px 20px;
  justify-content: flex-end;
}

.popup-button {
  padding: 10px 32px;
  border: none;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 92px;
  color: #171717;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  // 預設樣式
  &.default {
    background-color: #fff;
    color: #374151;
    border: 1px solid #D4D4D4;
    
  }
  
  // 主要按鈕樣式
  &.primary {
    background-color: #D1FAE5;
    color: #065F46;
    border: none;
    
    &:hover {
      background-color: #A7F3D0;
    }
  }
  
  // 危險按鈕樣式
  &.danger {
    background-color: #FCE7F3;
    color: #831843;
    
    &:hover {
      background-color: #FCE7F3;
    }
  }
  
  // 成功按鈕樣式
  &.success {
    background-color: #10b981;
    color: white;
    
    &:hover {
      background-color: #059669;
    }
  }
  
  // 次要按鈕樣式
  &.secondary {
    background-color: #6b7280;
    color: white;
    
    &:hover {
      background-color: #4b5563;
    }
  }
}

// 響應式設計
@media (max-width: 480px) {
  .popup-container {
    width: 95%;
    margin: 0 10px;
  }
  
  .popup-buttons {
    flex-direction: column;
    
    .popup-button {
      width: 100%;
    }
  }
}
</style>