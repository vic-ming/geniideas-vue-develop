<template>
  <div class="searchable-select" ref="selectContainer">
    <div 
      class="select-input" 
      :class="{ 'empty': !displayValue, 'open': isOpen }"
      @click="toggleDropdown"
    >
      <input
        ref="searchInput"
        type="text"
        v-model="searchQuery"
        :placeholder="placeholder"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="openDropdown"
        @click.stop
        class="search-field"
        :class="{ 'has-value': displayValue }"
      />
      <img 
        src="@/assets/images/chevron-down.svg" 
        alt="dropdown" 
        class="chevron-icon"
        :class="{ 'rotated': isOpen }"
      />
    </div>
    
    <div v-if="isOpen" class="dropdown-menu">
      <div v-if="filteredOptions.length === 0" class="no-results">
        <div class="no-results-text">找不到符合的選項</div>
      </div>
      <div
        v-for="(option, index) in filteredOptions"
        :key="option"
        class="dropdown-item"
        :class="{ 'highlighted': index === highlightedIndex, 'selected': option === modelValue }"
        @click="selectOption(option)"
        @mouseenter="highlightedIndex = index"
      >
        {{ option }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SearchableSelect',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    options: {
      type: Array,
      required: true,
      default: () => []
    },
    placeholder: {
      type: String,
      default: '請選擇'
    }
  },
  data() {
    return {
      isOpen: false,
      searchQuery: '',
      highlightedIndex: -1
    }
  },
  computed: {
    displayValue() {
      return this.modelValue;
    },
    filteredOptions() {
      if (!this.searchQuery) {
        return this.options;
      }
      const query = this.searchQuery.toLowerCase();
      return this.options.filter(option => 
        option.toLowerCase().includes(query)
      );
    }
  },
  watch: {
    modelValue(newValue) {
      // When value changes externally, update search query to show selected value
      if (!this.isOpen && newValue) {
        this.searchQuery = newValue;
      }
    },
    isOpen(newValue) {
      if (newValue) {
        // When opening, clear search to allow easy searching
        this.searchQuery = '';
        this.$nextTick(() => {
          this.$refs.searchInput?.focus();
          // Highlight current selection if it exists
          if (this.modelValue) {
            const index = this.filteredOptions.findIndex(opt => opt === this.modelValue);
            this.highlightedIndex = index >= 0 ? index : 0;
          } else {
            this.highlightedIndex = 0;
          }
        });
      } else {
        // When closing, show selected value
        this.searchQuery = this.modelValue || '';
        this.highlightedIndex = -1;
      }
    }
  },
  mounted() {
    // Initialize search query with current value
    this.searchQuery = this.modelValue || '';
    // Click outside to close
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    toggleDropdown() {
      this.isOpen = !this.isOpen;
    },
    openDropdown() {
      this.isOpen = true;
    },
    closeDropdown() {
      this.isOpen = false;
    },
    handleInput() {
      if (!this.isOpen) {
        this.isOpen = true;
      }
      // Highlight first item when searching
      if (this.filteredOptions.length > 0) {
        this.highlightedIndex = 0;
      } else {
        this.highlightedIndex = -1;
      }
    },
    handleKeydown(event) {
      if (!this.isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        this.openDropdown();
        return;
      }

      if (!this.isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.highlightedIndex = Math.min(
            this.highlightedIndex + 1,
            this.filteredOptions.length - 1
          );
          this.scrollToHighlighted();
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
          this.scrollToHighlighted();
          break;
        case 'Enter':
          event.preventDefault();
          if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
            this.selectOption(this.filteredOptions[this.highlightedIndex]);
          }
          break;
        case 'Escape':
        case 'Tab':
          event.preventDefault();
          this.closeDropdown();
          break;
      }
    },
    selectOption(option) {
      this.$emit('update:modelValue', option);
      this.searchQuery = option;
      this.closeDropdown();
    },
    handleClickOutside(event) {
      if (this.$refs.selectContainer && !this.$refs.selectContainer.contains(event.target)) {
        this.closeDropdown();
      }
    },
    scrollToHighlighted() {
      this.$nextTick(() => {
        const dropdown = this.$el.querySelector('.dropdown-menu');
        const highlighted = this.$el.querySelector('.dropdown-item.highlighted');
        if (dropdown && highlighted) {
          const dropdownRect = dropdown.getBoundingClientRect();
          const highlightedRect = highlighted.getBoundingClientRect();
          
          if (highlightedRect.bottom > dropdownRect.bottom) {
            highlighted.scrollIntoView({ block: 'nearest' });
          } else if (highlightedRect.top < dropdownRect.top) {
            highlighted.scrollIntoView({ block: 'nearest' });
          }
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.searchable-select {
  position: relative;
  width: 100%;
}

.select-input {
  position: relative;
  width: 100%;
  background: #F5F5F5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.open {
    .chevron-icon {
      transform: rotate(180deg);
    }
  }
}

.search-field {
  width: 100%;
  padding: 10px 32px 10px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  color: #171717;
  background: transparent;
  font-family: inherit;
  box-sizing: border-box;
  cursor: pointer;
  
  &:focus {
    outline: none;
    cursor: text;
  }
  
  &::placeholder {
    color: #A3A3A3;
  }
  
  &:not(.has-value) {
    color: #A3A3A3;
  }
}

.chevron-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  pointer-events: none;
  transition: transform 0.2s ease;
  
  &.rotated {
    transform: translateY(-50%) rotate(180deg) !important;
  }
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 10px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 5px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 5px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
}

.dropdown-item {
  padding: 10px 12px;
  font-size: 14px;
  color: #171717;
  cursor: pointer;
  transition: background-color 0.15s ease;
  
  &:hover,
  &.highlighted {
    background-color: #f5f5f5;
  }
  
  &.selected {
    background-color: #e8f5e9;
    font-weight: 500;
  }
  
  &.selected.highlighted {
    background-color: #d4edd6;
  }
}

.no-results {
  padding: 20px 12px;
  text-align: center;
  color: #A3A3A3;
  
  .no-results-icon {
    font-size: 32px;
    margin-bottom: 8px;
    opacity: 0.5;
  }
  
  .no-results-text {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    color: #737373;
  }
  
  .no-results-hint {
    font-size: 12px;
    color: #A3A3A3;
  }
}
</style>
