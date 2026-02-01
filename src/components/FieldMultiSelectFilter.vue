<!-- filepath: /share/sources/Contacto/cantactoWeb/src/components/FieldMultiSelectFilter.vue -->
<template>
  <div class="field-multiselect-filter">
    <div class="filter-header" @click="toggleDropdown">
      <span class="filter-label">{{ label || fieldName }}</span>
      <span class="filter-badge" v-if="selectedValues.length > 0">{{ selectedValues.length }}</span>
      <span class="dropdown-arrow" :class="{ open: isOpen }">▼</span>
    </div>
    
    <div v-if="isOpen" class="filter-dropdown">
      <div class="filter-search">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Search..."
          @click.stop
        />
      </div>
      
      <div class="filter-actions">
        <button @click.stop="selectAll" class="action-btn">Select All</button>
        <button @click.stop="clearAll" class="action-btn">Clear All</button>
      </div>
      
      <div class="filter-options">
        <label 
          v-for="option in filteredOptions" 
          :key="option.value"
          class="filter-option"
          @click.stop
        >
          <input 
            type="checkbox" 
            :value="option.value"
            v-model="selectedValues"
            @change="onSelectionChange"
          />
          <span class="option-label">{{ option.label }} <span class="option-count">({{ option.count }})</span></span>
        </label>
        <div v-if="filteredOptions.length === 0" class="no-options">
          No options found
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FieldMultiSelectFilter',
  props: {
    // The field/column name to filter on
    fieldName: { type: String, required: true },
    // The items array to extract unique values from
    items: { type: Array, default: () => [] },
    // Optional display label (defaults to fieldName)
    label: { type: String, default: '' },
    // Optional initial selected values
    initialValues: { type: Array, default: () => [] }
  },
  emits: ['change'],
  data() {
    return {
      isOpen: false,
      selectedValues: [...this.initialValues],
      searchTerm: ''
    };
  },
  computed: {
    options() {
      // Extract unique values from items for the specified field
      if (!Array.isArray(this.items) || !this.fieldName) return [];
      
      const valueCounts = {};
      this.items.forEach(item => {
        const value = item[this.fieldName];
        if (value !== null && value !== undefined && value !== '') {
          const key = String(value);
          valueCounts[key] = (valueCounts[key] || 0) + 1;
        }
      });
      
      return Object.keys(valueCounts)
        .sort()
        .map(value => ({
          value,
          label: value,
          count: valueCounts[value]
        }));
    },
    
    filteredOptions() {
      if (!this.searchTerm) return this.options;
      const term = this.searchTerm.toLowerCase();
      return this.options.filter(opt => 
        String(opt.label || '').toLowerCase().includes(term)
      );
    }
  },
  mounted() {
    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    toggleDropdown() {
      this.isOpen = !this.isOpen;
    },
    
    handleClickOutside(event) {
      const filterElement = this.$el;
      if (filterElement && !filterElement.contains(event.target)) {
        this.isOpen = false;
      }
    },
    
    selectAll() {
      this.selectedValues = this.filteredOptions.map(opt => opt.value);
      this.onSelectionChange();
    },
    
    clearAll() {
      this.selectedValues = [];
      this.onSelectionChange();
    },
    
    onSelectionChange() {
      this.$emit('change', {
        field: this.fieldName,
        values: [...this.selectedValues]
      });
    }
  },
  watch: {
    initialValues(newVal) {
      this.selectedValues = [...newVal];
    }
  }
};
</script>

<style scoped>
.field-multiselect-filter {
  position: relative;
  display: inline-block;
  min-width: 180px;
  user-select: none;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-header:hover {
  background: #e8e8e8;
}

.filter-label {
  flex: 1;
  font-weight: 500;
  font-size: 0.9em;
}

.filter-badge {
  background: #72ad45;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75em;
  font-weight: bold;
}

.dropdown-arrow {
  font-size: 0.7em;
  transition: transform 0.2s;
  color: #666;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.filter-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 100%;
  max-width: 320px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.filter-search {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.filter-search input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 0.9em;
  box-sizing: border-box;
}

.filter-search input:focus {
  outline: none;
  border-color: #72ad45;
}

.filter-actions {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.action-btn {
  flex: 1;
  padding: 4px 8px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #e8e8e8;
}

.filter-options {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  padding: 4px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.2s;
}

.filter-option:hover {
  background: #f9f9f9;
}

.filter-option input[type="checkbox"] {
  cursor: pointer;
  flex-shrink: 0;
}

.option-label {
  flex: 1;
  font-size: 0.9em;
  word-break: break-word;
}

.option-count {
  color: #888;
  font-size: 0.85em;
}

.filter-loading,
.no-options {
  padding: 16px;
  text-align: center;
  color: #888;
  font-size: 0.9em;
}
</style>
