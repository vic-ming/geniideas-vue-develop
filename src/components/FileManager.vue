<template>
  <div v-if="isOpen" class="file-manager-container">
    <div class="file-manager-top">
      <h2 class="section-title">檔案管理</h2>

      <button class="close-btn" @click="handleClose">✕</button>
    </div>
    <div class="file-manager">
      <div class="file-list-section">
        
        <div class="files-info">檔案列表 <span class="files-info-count">Show in {{ files.length }} files</span></div>
        
        <div class="file-table">
          <div class="table-header">
            <div class="col-project">工程名稱</div>
            <div class="col-date">更新日期</div>
            <div class="col-action">操作</div>
          </div>
          
          <div class="table-body">
            <div v-if="paginatedFiles.length === 0">
              <div style="text-align: center; font-size: 14px; color: #737373; font-weight: 500; padding: 12px 16px;">尚無檔案</div>
            </div>
            <div v-if="paginatedFiles.length > 0">
            <div
                
                v-for="file in paginatedFiles"
                :key="file.id"
                class="table-row"
              >
                <div class="col-project">{{ file.project_name }}</div>
                <div class="col-date">{{ formatDate(file.updated_at) }}</div>
                <div class="col-action">
                  <button class="btn-read" @click="handleReadFile(file)">
                    讀取檔案
                  </button>
                  <button 
                    class="btn-delete" 
                    :title="currentFileId && file.id === currentFileId ? '無法刪除當前開啟的檔案' : ''"
                    @click="handleDeleteFile(file)">

                    <img src="@/assets/images/trash.svg" alt="delete" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="paginatedFiles.length > 0" class="pagination">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <img src="@/assets/images/chevron-left.svg" alt="prev" />
          </button>
          <span class="page-info">
            <button
              v-for="page in visiblePages"
              :key="page"
              class="page-number"
              :class="{ active: page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </span>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <img src="@/assets/images/chevron-right.svg" alt="next" />
          </button>
        </div>
      </div>
      
      <div class="save-section">
        <div class="save-section-title">檔案儲存</div>
        
        <div class="save-content">
          <div class="form-group">
            <label>檔案名稱</label>
            <input
              v-model="filename"
              type="text"
              class="filename-input"
              :class="{ 'filename-input': true, 'error-border': showNameError }"
              placeholder="輸入檔案名稱"
              @input="handleFilenameChange"
              :disabled="isDisabled" 
            />
            <p v-if="showNameError" class="error-message">請先命名此檔案名稱</p>
          </div>
          
          <p v-if="isModified" class="modify-notice">
            已修改名稱,請記得點擊「儲存」以更新。
          </p>
          
          <div class="form-actions">
            <button class="btn-return" @click="handleClose">返回</button>
            <button class="btn-save" :disabled="isDisabled || filename.trim() === ''" @click="handleSave">
              儲存
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileManager',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    currentData: {
      type: Object,
      default: () => ({})
    },
    currentFilename: {
      type: String,
      default: ''
    },
    currentFileId: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      files: [],
      currentPage: 1,
      itemsPerPage: 10,
      filename: '',
      selectedFile: null,
      originalFilename: '', // 記錄打開時的檔案名稱
      showNameError: false // 是否顯示檔名錯誤提示
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.files.length / this.itemsPerPage)
    },
    paginatedFiles() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.files.slice(start, end)
    },
    visiblePages() {
      const pages = []
      const total = this.totalPages
      let start = Math.max(1, this.currentPage - 2)
      let end = Math.min(total, start + 4)
      
      if (end - start < 4) {
        start = Math.max(1, end - 4)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    },
    isDisabled() {
      // 檢查是否有單線圖數據
      return !this.currentData || !this.currentData.allModuleSets || this.currentData.allModuleSets.length === 0
    },
    isModified() {
      // 只有在當前有舊文件名，且新文件名與舊文件名不同時才顯示提示
      return this.originalFilename && 
             this.filename.trim() && 
             this.filename.trim() !== this.originalFilename
    }
  },
  watch: {
    isOpen(newVal) {
      if (newVal) {
        this.loadFiles()
        // 初始化檔案名稱為當前檔案名稱
        this.originalFilename = this.currentFilename
        this.filename = this.currentFilename
        this.showNameError = false
      }
    }
  },
  methods: {
    async loadFiles() {
      try {
        const response = await fetch('/api/flowcharts')
        const result = await response.json()
        
        if (result.success) {
          this.files = result.data
        } else {
          console.error('Error loading files:', result.error)
        }
      } catch (error) {
        console.error('Failed to load files:', error)
      }
    },
    
    async handleReadFile(file) {
      try {
        const response = await fetch(`/api/flowcharts/${file.id}`)
        const result = await response.json()
        
        if (result.success) {
          const data = JSON.parse(result.data.data)
                    // 傳遞檔案資訊和數據，不立即關閉FileManager
          // 讓 handleFileManagerLoad 決定是否需要關閉

          this.$emit('load', {
            data: data,
            file: {
              id: result.data.id,
              project_name: result.data.project_name,
              updated_at: result.data.updated_at
            },
            shouldCloseFileManager: true // 標記是否需要關閉FileManager
          })
        } else {
          console.error('Error reading file:', result.error)
        }
      } catch (error) {
        console.error('Failed to read file:', error)
      }
    },
    
    async handleDeleteFile(file) {
        this.$emit('delete-file', file);
    },
    
    async handleSave() {
      // 如果沒有單線圖數據，不允許儲存
      if (this.isDisabled) {
        alert('請先建立或讀取單線圖')
        return
      }
      
      if (!this.filename.trim()) {
        this.triggerNameValidationError()
        return
      }
      
      this.$emit('save', {
        project_name: this.filename,
        data: this.currentData
      })
      
      await this.loadFiles()
    },
    
    /**
     * 觸發檔名驗證錯誤（供父組件調用）
     */
    triggerNameValidationError() {
      this.showNameError = true
      this.$emit('show-popup', {
        title: '',
        message: '目前檔案尚未命名，請先命名此檔案名稱後才可儲存喔！',
        buttons: [
          {
            text: '確定',
            class: 'primary',
            action: 'confirm'
          }
        ],
        showIcon: false,
        closeOnOverlay: true
      })
    },
    
    handleClose() {
      this.filename = ''
      this.originalFilename = ''
      this.showNameError = false
      this.$emit('close')
    },
    
    handleFilenameChange() {
      if (this.filename.trim()) {
        this.showNameError = false
      }
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      // 加上 8 小時
      date.setHours(date.getHours() + 8)

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
    },
    
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.file-manager-container {
  position: fixed;
  top: 86px;
  left: 80px;
  right: 0;
  bottom: 0;
  background: white;
  padding: 16px;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-manager-top {
  padding: 7.5px 0;
  height: 48px;
  border-bottom: 1px solid #D4D4D4;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.file-manager {
  display: flex;
  flex: 1;
  overflow: hidden; /* 防止內容撐開外層容器 */
}

.file-list-section {
  flex: 1;
  padding: 32px 16px 40px 0;
  overflow-y: auto;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #171717;
  margin-bottom: 12px;
}

.files-info {
  color: #525252;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 500;
}
.files-info-count {
  color: #A3A3A3;
  font-size: 14px;
  font-weight: 500;
  margin-left: 10px;
}

.file-table {
  /* border: 1px solid #E5E7EB; */
  flex: 1;
  overflow-y: auto; /* 確保表格內容可滾動 */
}

.table-header,
.table-row {
  display: grid;
  align-items: center;
  grid-template-columns: 3fr 1fr 200px;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #D4D4D4;
  color: #171717;
}

.table-header {
  
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
  font-weight: 500;
  color: #737373;
  font-size: 14px;

}

.table-row {
  cursor: pointer;
  transition: background 0.2s;
  
  // &:hover {
  //   background: #F9FAFB;
  // }
}

.btn-read,
.btn-delete {
  padding: 6px 12px;
  border: 1px solid #D4D4D4;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #171717;
}

.btn-read:hover {
  background: #F3F4F6;
}

.btn-delete {
  border: none;
  background: none;
    
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    opacity: 0.7;
  }

}
.col-action{
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
}



.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}
.page-info{
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn,
.page-number {
  width: 33px;
  height: 33px;
  border: 1px solid #D4D4D4;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number.active {
  background: #D1FAE5;
  color: #065F46;
  border-color: #D1FAE5;
}

.save-section {
  width: 412px;
  background: white;
  border-left: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  padding: 32px 0px 40px 16px;
}

.save-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #525252;
  margin-left: 16px;
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  
  &:hover {
    color: #171717;
  }
}

.save-content {
  padding: 16px;
}

.form-group {
  margin-bottom: 8px;
  
  label {
    display: block;
    margin-bottom: 4px;
    color: #737373;
    font-weight: 500;
    font-size: 14px;
  }
}

.filename-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #D4D4D4;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #10B981;
  }
  
  &.error-border {
    border-color: #EF4444; /* 紅框顏色 */
    
    &:focus {
      border-color: #EF4444;
    }
  }
}

.error-message {
  color: #EF4444;
  font-size: 14px;
  margin-top: 4px;
}

.modify-notice {
  color: #147C4A;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: right;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 32px;
}

.btn-return,
.btn-save {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #D4D4D4;
  border-radius: 100px;
  max-width: 92px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-return {
  background: white;
  color: #374151;
}

.btn-return:hover {
  background: #F3F4F6;
}

.btn-save {
  background: #D1FAE5;
  color: #065F46;
  border-color: #D1FAE5;
}

.btn-save:hover {
  background: #A7F3D0;
}

.btn-save:disabled {
  background: #E5E7EB;
  color: #9CA3AF;
  border-color: #E5E7EB;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>

