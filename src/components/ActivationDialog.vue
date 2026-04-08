<template>
  <div v-if="visible" class="activation-overlay">
    <div class="activation-dialog">
      <div class="activation-header">
        <div class="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2>產品啟用</h2>
        <p>請輸入產品金鑰以啟用軟體</p>
      </div>
      
      <div class="activation-body">
        <div class="input-group">
          <input 
            type="password" 
            v-model="inputKey" 
            placeholder="請輸入金鑰"
            @keyup.enter="verifyKey"
            :class="{ 'error': isError }"
            ref="keyInput"
          />
          <span v-if="isError" class="error-message">金鑰錯誤，請重試</span>
        </div>
      </div>

      <div class="activation-footer">
        <button class="activate-btn" @click="verifyKey">啟用</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActivationDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      inputKey: '',
      isError: false
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          if (this.$refs.keyInput) {
            this.$refs.keyInput.focus();
          }
        });
      }
    },
    inputKey() {
      if (this.isError) {
        this.isError = false;
      }
    }
  },
  methods: {
    verifyKey() {
      if (this.inputKey === 'GID59075364') {
        this.$emit('activated');
        this.inputKey = '';
        this.isError = false;
      } else {
        this.isError = true;
        // 錯誤動畫效果
        const input = this.$refs.keyInput;
        input.classList.add('shake');
        setTimeout(() => {
          input.classList.remove('shake');
        }, 500);
      }
    }
  }
}
</script>

<style scoped>
.activation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.activation-dialog {
  background: white;
  width: 400px;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.activation-header {
  margin-bottom: 24px;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  background: #D1FAE5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #065F46;
}

.activation-header h2 {
  font-size: 24px;
  color: #1f2937;
  margin: 0 0 8px;
  font-weight: 600;
}

.activation-header p {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}

.input-group {
  margin-bottom: 24px;
  position: relative;
}

input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: all 0.2s;
  text-align: center;
  letter-spacing: 2px;
  width: 100%;
  
  border: 1px solid #D4D4D4;
  border-radius: 4px;
}

input:focus {
    outline: none;
    border-color: #10B981;
}

input.error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 8px;
  display: block;
}

.activate-btn {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  background-color: #D1FAE5;
  color: #065F46;
  border: none;
}

.activate-btn:hover {
  background-color: #A7F3D0;
}

.shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
