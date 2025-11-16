<template>
  <div v-if="isOpen" class="setting-container">
    <div class="setting-header">
      <h2>檔案設定</h2>
    </div>
    <div class="setting-content">
      <form @submit.prevent="handleSave">
        <!-- 工程名稱 -->
        <div class="form-group">
          <label>工程名稱</label>
          <input 
            v-model="formData.projectName" 
            type="text" 
            class="form-input" 
            placeholder="請輸入工程名稱"
          />
        </div>

        <!-- 客户 -->
        <div class="form-group">
          <label>客户</label>
          <input 
            v-model="formData.customer" 
            type="text" 
            class="form-input" 
            placeholder="請輸入客戶名稱"
            maxlength="20"
          />
        </div>

        <!-- 厂商资讯 -->
        <div class="form-group">
          <label>廠商資訊</label>
          <input 
            v-model="formData.vendorInfo" 
            type="text" 
            class="form-input" 
            placeholder="請輸入廠商資訊"
            maxlength="20"
          />
        </div>

        <!-- 会勘监工 -->
        <div class="form-group">
          <label>會勘監工<span class="required">*</span></label>
          <input 
            v-model="formData.surveySupervisor" 
            type="text" 
            class="form-input"
            :class="{ 'input-error': errors.surveySupervisor }"
            placeholder="請輸入會勘監工"
            @input="errors.surveySupervisor = false"
            maxlength="20"
          />
        </div>

        <!-- 会勘日期 -->
        <div class="form-group">
          <label>會勘日期<span class="required">*</span></label>
          <input 
            v-model="formData.surveyDate" 
            type="date" 
            class="form-input date-input"
            :class="{ 'input-error': errors.surveyDate }"
            placeholder="Select Date"
            @input="errors.surveyDate = false"
          />
        </div>

        <!-- 机台名称 -->
        <div class="form-group">
          <label>機台名稱<span class="required">*</span></label>
          <input 
            v-model="formData.machineName" 
            type="text" 
            class="form-input"
            :class="{ 'input-error': errors.machineName }"
            placeholder="請輸入機台名稱"
            @input="errors.machineName = false"
            maxlength="50"
          />
        </div>

        <!-- Location ID -->
        <div class="form-group">
          <label>Location ID</label>
          <input 
            v-model="formData.locationId" 
            type="text" 
            class="form-input" 
            placeholder="請輸入Location ID"
            maxlength="50"
          />
        </div>

        <!-- CODE -->
        <div class="form-group">
          <label>CODE</label>
          <input 
            v-model="formData.code" 
            type="text" 
            class="form-input" 
            placeholder="請輸入CODE"
            maxlength="50"
          />
        </div>

        <!-- 工程师联络资讯 -->
        <div class="form-group">
          <label>工程師聯絡資訊</label>
          <input 
            v-model="formData.engineerContact" 
            type="text" 
            class="form-input" 
            placeholder="請輸入工程師聯絡資訊"
            maxlength="50"
          />
        </div>

        <!-- 施工厂商 -->
        <div class="form-group">
          <label>施工廠商</label>
          <input 
            v-model="formData.constructionVendor" 
            type="text" 
            class="form-input" 
            placeholder="請輸入施工廠商"
            maxlength="50"
          />
        </div>

        <!-- 绘图日期 -->
        <div class="form-group">
          <label>繪圖日期</label>
          <input 
            v-model="formData.drawingDate" 
            type="date" 
            class="form-input date-input" 
            placeholder="Select Date"
          />
        </div>

        <!-- 备注资讯 -->
        <div class="form-group">
          <label>備註資訊</label>
          <textarea 
            v-model="formData.notes" 
            class="form-textarea" 
            placeholder="請輸入備註資訊"
            rows="5"
            maxlength="100"
          ></textarea>
        </div>

        <!-- Hierachy种类 -->
        <div class="form-group">
          <label>Hierachy種類</label>
          <div class="radio-group">
            <label class="radio-label">
              <input 
                v-model="formData.hierarchyType" 
                type="radio" 
                value="specialGas"
                class="radio-input"
              />
              <span>Special Gas</span>
            </label>
            <label class="radio-label">
              <input 
                v-model="formData.hierarchyType" 
                type="radio" 
                value="bulkGas"
                class="radio-input"
              />
              <span>Bulk Gas</span>
            </label>
          </div>
        </div>

        <!-- 按钮 -->
        <div class="form-actions">
          <button type="button" class="btn btn-cancel" @click="handleCancel">
            取消
          </button>
          <button type="submit" class="btn btn-save">
            儲存
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Setting',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    settings: {
      type: Object,
      default: () => ({
        projectName: '',
        customer: '',
        vendorInfo: '',
        surveySupervisor: '',
        surveyDate: '',
        machineName: '',
        locationId: '',
        code: '',
        engineerContact: '',
        constructionVendor: '',
        drawingDate: '',
        notes: '',
        hierarchyType: 'bulkGas'
      })
    }
  },
  data() {
    return {
      formData: {
        projectName: '',
        customer: '',
        vendorInfo: '',
        surveySupervisor: '',
        surveyDate: '',
        machineName: '',
        locationId: '',
        code: '',
        engineerContact: '',
        constructionVendor: '',
        drawingDate: '',
        notes: '',
        hierarchyType: 'bulkGas'
      },
      errors: {
        surveySupervisor: false,
        surveyDate: false,
        machineName: false
      }
    }
  },
  watch: {
    settings: {
      immediate: true,
      deep: true,
      handler(newSettings) {
        // 當 settings prop 變化時，更新 formData
        this.formData = { ...newSettings };
      }
    }
  },
  methods: {
    closeSetting() {
      this.$emit('close')
    },
    handleCancel() {
      this.closeSetting()
    },
    handleSave() {
      // 重置錯誤狀態
      this.errors = {
        surveySupervisor: false,
        surveyDate: false,
        machineName: false
      }

      // 驗證必填欄位
      let hasError = false

      // if (!this.formData.surveySupervisor || this.formData.surveySupervisor.trim() === '') {
      //   this.errors.surveySupervisor = true
      //   hasError = true
      // }

      // if (!this.formData.surveyDate || this.formData.surveyDate.trim() === '') {
      //   this.errors.surveyDate = true
      //   hasError = true
      // }

      // if (!this.formData.machineName || this.formData.machineName.trim() === '') {
      //   this.errors.machineName = true
      //   hasError = true
      // }

      // 如果有錯誤，阻止儲存
      if (hasError) {
        // 滾動到第一個錯誤欄位
        this.$nextTick(() => {
          const firstError = document.querySelector('.input-error')
          if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
            firstError.focus()
          }
        })
        return
      }

      // 驗證通過，執行儲存
      this.$emit('save', this.formData)
      this.closeSetting()
    }
  }
}
</script>

<style lang="scss" scoped>
.setting-container {
  position: fixed;
  top: 85px;
  left: 80px;
  width: 320px;
  height: calc(98vh - 85px);
  background: white;
  border-radius: 8px;
  box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 900;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #D4D4D4;

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #525252;
  }
}

.setting-content {
  flex: 1;
  padding: 11px;
  overflow-y: auto;
  margin: 5px;

  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 14px;
    font-weight: 500;
    color: #737373;
    .required {
      color: #FF0000;
    }
  }
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  color: #171717;
  background: #F5F5F5;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: #A3A3A3;
  }

  &:focus {
    outline: none;
  }

  &.input-error {
    background: #FEF2F2;
    border: 1px solid #FCA5A5;
  }
}

.error-message {
  color: #DC2626;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.date-input {
  cursor: pointer;
  color: #A3A3A3;

  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
  }

  &:focus,
  &:valid {
    color: #171717;
  }

  &.input-error {
    color: #171717;
  }
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  color: #171717;
  background: #FAFAFA;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: #A3A3A3;
  }

  &:focus {
    outline: none;
  }
}

.radio-group {
  display: flex;
  gap: 16px;
  align-items: center;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #171717;

  .radio-input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #3F8009;
  }

  span {
    user-select: none;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #E5E5E5;
}

.btn {
  padding: 10px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;

  &:active {
    transform: scale(0.98);
  }
}

.btn-cancel {
  background: white;
  color: #171717;
  border: 1px solid #D4D4D4;

  &:hover {
    background: #F5F5F5;
    border-color: #A3A3A3;
  }
}

.btn-save {
  background: #E4FBF0;
  color: #064C39;

  &:hover {
    background: #357007;
    color: #E4FBF0;
  }
}

/* 自定义滚动条样式 */
.setting-content::-webkit-scrollbar {
  width: 6px;
  position: relative;
}

.setting-content::-webkit-scrollbar-track {
  background: transparent;
 
}

.setting-content::-webkit-scrollbar-thumb {
  background: #D4D4D4;
  border-radius: 3px;

  &:hover {
    background: #A3A3A3;
  }
}
</style>

