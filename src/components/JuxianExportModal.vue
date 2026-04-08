<template>
  <transition name="fade">
    <div
      v-if="isOpen"
      class="juxian-modal-overlay"
      @click.self="$emit('close')"
    >
      <div class="juxian-modal">
        <div class="modal-header">
          <div class="modal-title">
            <h2>聚賢料表匯出設定</h2>
          </div>
          <button class="close-btn" @click="$emit('close')" aria-label="close">
            ✕
          </button>
        </div>

        <div class="modal-body">
          <div
            v-for="column in renderColumns"
            :key="column.id"
            class="modal-column"
          >
            <div
              v-for="section in column.sections"
              :key="section.title"
              class="modal-section"
            >
              <div class="section-title">{{ section.title }}</div>
              <div
                v-for="field in section.fields"
                :key="field.key"
                class="form-field"
              >
                <label :for="field.key">
                  {{ field.label }}
                  <span v-if="isFieldRequired(field.key)" class="required">*</span>
                </label>
                <div class="select-wrapper">
                  <select
                    class="brand-select"
                    :class="{ 'is-empty': isFieldRequired(field.key) && !getFieldValue(field) }"
                    :id="field.key"
                    :value="getFieldValue(field)"
                    :required="isFieldRequired(field.key)"
                    :aria-required="isFieldRequired(field.key)"
                    :aria-invalid="isFieldRequired(field.key) && !getFieldValue(field)"
                    :disabled="isFieldDisabled(field)"
                    :title="getFieldTitle(field)"
                    @change="$emit('update-field', { key: field.key, value: $event.target.value })"
                  >
                    <option value="" disabled>請選擇品牌</option>
                  <option
                    v-for="option in getFieldOptions(field)"
                    :key="option.value || option"
                    :value="option.value || option"
                  >
                    {{ option.label || option }}
                  </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <span v-if="!isFormValid" class="validation-hint">請選擇所有必填品牌再匯出</span>
          <button class="btn btn-light" @click="$emit('close')">取消</button>
          <button
            class="btn btn-primary"
            :disabled="!isFormValid"
            :aria-disabled="!isFormValid"
            :title="!isFormValid ? '請選擇所有必填品牌再匯出' : ''"
            @click="$emit('confirm')"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
const defaultColumns = [
  {
    id: 'column-1',
    sections: [
      {
        title: '管線',
        fields: [{ key: 'pipelineBrand', label: '管線品牌' }]
      },
      {
        title: '閥件',
        fields: [
          { key: 'ballValveBrand', label: 'Ball Valve品牌' },
          { key: 'diaphragmValveBrand', label: 'DIAPHRAGM Valve品牌' },
          { key: 'bellowValveBrand', label: 'BELLOW Valve品牌' },
          { key: 'regulatorBrand', label: 'REGULATOR品牌' }
        ]
      }
    ]
  },
  {
    id: 'column-2',
    sections: [
      {
        title: '其他元件',
        fields: [
          { key: 'springBrand', label: 'SPRING彈簧品牌' },
          { key: 'overTubeBrand', label: 'Over Tube滑套品牌' },
          { key: 'gaugeBrand', label: 'GAUGE壓力錶品牌' },
          { key: 'glandBrand', label: 'GLAND品牌' },
          { key: 'nutBrand', label: 'NUT品牌' },
          { key: 'gasketBrand', label: 'GASKET品牌' },
          { key: 'stopSpacerBrand', label: 'STOP SPACER 收尾環品牌' }
        ]
      }
    ]
  },
  {
    id: 'column-3',
    sections: [
      {
        title: '配件',
        fields: [
          { key: 'reducerBrand', label: 'REDUCER品牌' },
          { key: 'reducerTeeBrand', label: 'REDUCER TEE品牌' },
          { key: 'teeBrand', label: 'TEE品牌' },
          { key: 'elbowBrand', label: 'ELBOW品牌' },
          { key: 'doubleElbowBrand', label: 'DOUBLE ELBOW品牌' },
          { key: 'doubleTeeBrand', label: 'DOUBLE TEE品牌' },
        ]
      }
    ]
  }
];

const FIXED_FIELD_VALUES = {
  stopSpacerBrand: 'KUZE',
  doubleTeeBrand: 'KUZE',
};

export default {
  name: 'JuxianExportModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    formData: {
      type: Object,
      required: true
    },
    columns: {
      type: Array,
      default: () => defaultColumns
    },
    defaultOptions: {
      type: Array,
      default: () => ['GENIIDEAS', 'CUSTOM', 'N/A']
    },
    fieldOptions: {
      type: Object,
      default: () => ({})
    },
    regulatorEnabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    renderColumns() {
      return this.columns && this.columns.length ? this.columns : defaultColumns;
    },
    requiredFieldKeys() {
      return this.renderColumns
        .map(column =>
          (column.sections || []).flatMap(section =>
            (section.fields || []).map(field => field.key).filter(Boolean)
          )
        )
        .flat();
    },
    activeRequiredFieldKeys() {
      return this.requiredFieldKeys.filter(key => this.isFieldRequired(key));
    },
    isFormValid() {
      return this.activeRequiredFieldKeys.every(key => {
        const value = FIXED_FIELD_VALUES[key] ?? this.formData?.[key];
        return value !== undefined && value !== null && String(value).trim() !== '';
      });
    }
  },
  created() {
    this.ensureFixedFieldDefaults();
    this.syncConditionalFields();
  },
  watch: {
    isOpen(value) {
      if (value) {
        this.ensureFixedFieldDefaults();
        this.syncConditionalFields();
      }
    },
    regulatorEnabled() {
      this.syncConditionalFields();
    }
  },
  methods: {
    ensureFixedFieldDefaults() {
      if (!this.formData) return;
      Object.entries(FIXED_FIELD_VALUES).forEach(([key, value]) => {
        if (this.formData[key] !== value) {
          this.$emit('update-field', { key, value });
        }
      });
    },
    syncConditionalFields() {
      if (!this.formData) return;
      if (!this.regulatorEnabled && this.formData.regulatorBrand) {
        this.$emit('update-field', { key: 'regulatorBrand', value: '' });
      }
    },
    isFixedField(field) {
      return Boolean(field && FIXED_FIELD_VALUES[field.key]);
    },
    isFieldRequired(key) {
      if (key === 'regulatorBrand') {
        return this.regulatorEnabled;
      }
      // Blue-framed fields are not required
      const optionalFields = [
        'springBrand',
        'overTubeBrand',
        'bellowValveBrand',
        'doubleElbowBrand',
        'stopSpacerBrand'
      ];
      if (optionalFields.includes(key)) {
        return false;
      }
      return true;
    },
    isFieldDisabled(field) {
      if (this.isFixedField(field)) {
        return true;
      }
      if (field?.key === 'regulatorBrand' && !this.regulatorEnabled) {
        return true;
      }
      return false;
    },
    getFieldTitle(field) {
      if (this.isFixedField(field)) {
        return '此欄位固定為 KUZE';
      }
      if (field?.key === 'regulatorBrand' && !this.regulatorEnabled) {
        return '請先於任一盤面勾選 Regulator';
      }
      return '';
    },
    getFieldValue(field) {
      if (!field) {
        return '';
      }
      if (this.isFixedField(field)) {
        return FIXED_FIELD_VALUES[field.key];
      }
      return this.formData?.[field.key] || '';
    },
    getFieldOptions(field) {
      if (this.isFixedField(field)) {
        const fixedValue = FIXED_FIELD_VALUES[field.key];
        return [{ label: fixedValue, value: fixedValue }];
      }
      const specific = this.fieldOptions?.[field.key];
      if (Array.isArray(specific) && specific.length > 0) {
        return specific;
      }
      if (Array.isArray(field.options) && field.options.length > 0) {
        return field.options;
      }
      return this.defaultOptions;
    }
  }
};
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.juxian-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.juxian-modal {
  width: 1204px;
  max-width: 90vw;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0px 0px 16px 0px rgba(0, 0, 0, 0.34);
  padding: 16px;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #D4D4D4;
  height: 47px;
  min-height: 47px;
}

.modal-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #262626;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
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

.modal-body {
  display: flex;
  gap: 40px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.modal-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.modal-section {
  border-radius: 16px;
  margin: 16px 0;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #171717;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.form-field:last-child {
  margin-bottom: 0;
}

label {
  font-size: 14px;
  color: #737373;
  font-weight: 500;
  .required {
    color: #FF0000;
  }
}

.select-wrapper {
  position: relative;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid transparent;
  transition: background 0.2s ease, border-color 0.2s ease;
}


.select-wrapper::after {
  content: '';
  position: absolute;
  right: 14px;
  top: 50%;
  width: 14px;
  height: 14px;
  transform: translateY(-50%);
  background: url('@/assets/images/chevron-down.svg') no-repeat center;
  background-size: 14px;
  pointer-events: none;
}

.brand-select {
  width: 100%;
  height: 42px;
  border: none;
  outline: none;
  font-size: 14px;
  color: #171717;
  background: transparent;
  padding: 0 36px 0 12px;
  box-sizing: border-box;
  appearance: none;
  font-family: inherit;
  cursor: pointer;
}

.brand-select.is-empty {
  color: #a3a3a3;
}


.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.validation-hint {
  font-size: 13px;
  color: #dc2626;
  margin-right: auto;
  align-self: center;
}

.btn {
  padding: 10px 32px;
  border-radius: 100px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 92px;
  color: #171717;
}

.btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn:active {
  transform: translateY(1px);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.btn-light {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d4d4d4;
}

.btn-light:hover {
  background: #f5f5f5;
  border-color: #a3a3a3;
}

.btn-primary {
  background: #d1fae5;
  color: #065f46;
}

.btn-primary:hover {
  background: #a7f3d0;
}

.btn-primary:disabled {
  background: #e5e5e5;
  color: #9ca3af;
}
</style>

