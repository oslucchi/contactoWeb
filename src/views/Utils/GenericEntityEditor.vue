<template>
  <div v-if="show" class="modal-overlay" @click.self="onCancel">
    <div class="modal-content">
      <button class="modal-close" @click="onCancel">✕</button>
      <h3>{{ title }}</h3>
      
      <div class="form-container">
        <div v-for="field in editableFields" :key="field.name" class="form-field" v-show="field.visible !== false">
          <label :for="'field-' + field.name">{{ field.label || formatFieldName(field.name) }}</label>
          
          <!-- Text input for strings -->
          <input
            v-if="field.type === 'string' || field.type === 'text'"
            :id="'field-' + field.name"
            v-model="localEntity[field.name]"
            type="text"
            :placeholder="field.placeholder || ''"
            :readonly="field.editable === false"
            :disabled="field.editable === false"
          />
          
          <!-- Number input -->
          <input
            v-else-if="field.type === 'number'"
            :id="'field-' + field.name"
            v-model.number="localEntity[field.name]"
            type="number"
            :readonly="field.editable === false"
            :disabled="field.editable === false"
          />
          
          <!-- Date/datetime input -->
          <input
            v-else-if="field.type === 'date' || field.type === 'datetime'"
            :id="'field-' + field.name"
            v-model="localEntity[field.name]"
            :type="field.type === 'datetime' ? 'datetime-local' : 'date'"
            :readonly="field.editable === false"
            :disabled="field.editable === false"
          />
          
          <!-- Boolean checkbox -->
          <input
            v-else-if="field.type === 'boolean'"
            :id="'field-' + field.name"
            v-model="localEntity[field.name]"
            type="checkbox"
            :disabled="field.editable === false"
          />
          
          <!-- Textarea for long text -->
          <textarea
            v-else-if="field.type === 'textarea'"
            :id="'field-' + field.name"
            v-model="localEntity[field.name]"
            :rows="field.rows || 3"
            :placeholder="field.placeholder || ''"
            :readonly="field.editable === false"
            :disabled="field.editable === false"
          ></textarea>
          
          <!-- Select dropdown -->
          <select
            v-else-if="field.type === 'select'"
            :id="'field-' + field.name"
            v-model="localEntity[field.name]"
            :disabled="field.editable === false"
          >
            <option value="">-- Select --</option>
            <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          
          <!-- Icon selector -->
          <div v-else-if="field.type === 'icon-select'" class="icon-select-wrapper">
            <select
              :id="'field-' + field.name"
              v-model.number="localEntity[field.name]"
              class="icon-select"
              @change="$forceUpdate()"
              :disabled="field.editable === false"
            >
              <option value="">-- Select Icon --</option>
              <option 
                v-for="icon in getIconOptions(field)" 
                :key="getIconKey(icon)" 
                :value="getIconValue(icon)"
              >
                {{ getIconLabel(icon) }}
              </option>
            </select>
            <div v-if="localEntity[field.name]" class="icon-preview">
              <img :src="getIconPath(getIconFileName(field, localEntity[field.name]))" :alt="getSelectedIconLabel(field, localEntity[field.name])" />
            </div>
          </div>

          <!-- Multi-select table -->
          <div v-else-if="field.type === 'multi-select-table'" class="multi-select-field">
            <!-- Selected items display (chips/tags) -->
            <div v-if="getSelectedItems(field).length > 0" class="selected-items">
              <span v-for="item in getSelectedItems(field)" 
                    :key="getItemId(item, field)" 
                    class="selected-chip">
                {{ formatItemDisplay(item, field) }}
                <button @click="removeItem(field, item)" class="remove-btn" type="button">×</button>
              </span>
            </div>
            
            <!-- Search input -->
            <input 
              type="text"
              v-model="searchQueries[field.name]"
              :placeholder="field.placeholder || 'Type at least 3 characters to search...'"
              @input="onSearchInput(field)"
              class="search-input"
              :disabled="field.editable === false"
            />
            
            <!-- Results table (shown when search active) -->
            <div v-if="searchResults[field.name] && searchResults[field.name].length > 0" 
                 class="results-table-container">
              <table class="results-table">
                <thead>
                  <tr>
                    <th width="40">Select</th>
                    <th v-for="col in field.tableConfig.displayColumns" 
                        :key="col.colName"
                        :style="col.width ? { width: col.width + 'px' } : {}">
                      {{ col.label }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in searchResults[field.name]" 
                      :key="getItemId(item, field)"
                      @click="toggleItemSelection(field, item)"
                      class="result-row"
                      :class="{ 'selected': isItemSelected(field, item) }">
                    <td class="checkbox-cell">
                      <input 
                        type="checkbox" 
                        :checked="isItemSelected(field, item)"
                        @click.stop="toggleItemSelection(field, item)"
                      />
                    </td>
                    <td v-for="col in field.tableConfig.displayColumns" :key="col.colName">
                      {{ item[col.colName] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Loading/No results messages -->
            <div v-if="searchLoading[field.name]" class="search-status">
              Searching...
            </div>
            <div v-else-if="searchQueries[field.name] && 
                            searchQueries[field.name].length >= getMinSearchLength(field) &&
                            (!searchResults[field.name] || searchResults[field.name].length === 0)"
                 class="search-status">
              No results found
            </div>
          </div>
          
          <!-- Default to text input -->
          <input
            v-else
            :id="'field-' + field.name"
            v-model="localEntity[field.name]"
            type="text"
            :readonly="field.editable === false"
            :disabled="field.editable === false"
          />
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" @click="onCancel">Cancel</button>
        <button class="btn-save" @click="onSave">{{ saveLabel }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';

function getClassByName(name) {
  if (!name) {
    return Object;
  }
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const mod = require(`@/types/${name}`);
    return (mod && mod.default) ? mod.default : mod;
  } catch (e) {
    console.error(`getClassByName: could not load class "${name}", returning Object fallback`, e);
    return Object;
  }
}

export default {
  name: 'GenericEntityEditor',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Edit Item'
    },
    saveLabel: {
      type: String,
      default: 'Save'
    },
    // Name of the class in types/ folder
    className: {
      type: String,
      default: null
    },
    // Existing entity to edit (or null for new)
    entity: {
      type: Object,
      default: null
    },
    // Optional field definitions
    // Format: [{ name: 'fieldName', label: 'Field Label', type: 'string|number|date|datetime|boolean|textarea|select', editable: true, visible: true, placeholder: '...', options: [...], rows: 3 }]
    fieldDefinitions: {
      type: Array,
      default: null
    },
    // Optional: pre-populate some fields (useful for new entities with defaults)
    defaults: {
      type: Object,
      default: () => ({})
    },
    // Available icons for icon-select fields (array of icon filenames)
    iconOptions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      localEntity: {},
      searchQueries: {},      // { fieldName: 'searchText' }
      searchResults: {},      // { fieldName: [results...] }
      searchLoading: {},      // { fieldName: true/false }
      searchDebounce: {}      // Debounce timers
    };
  },
  computed: {
    editableFields() {
      // If field definitions are provided, use them
      if (this.fieldDefinitions && this.fieldDefinitions.length > 0) {
        return this.fieldDefinitions;
      }

      // Otherwise, introspect the entity
      if (!this.localEntity || typeof this.localEntity !== 'object') {
        return [];
      }

      // Get fields from the entity object
      const fields = [];
      for (const key in this.localEntity) {
        if (Object.prototype.hasOwnProperty.call(this.localEntity, key)) {
          // Skip id field for new entities
          if (key === 'id' && !this.entity) continue;
          
          // Infer type from value
          const value = this.localEntity[key];
          let type = 'text';
          
          if (typeof value === 'number') {
            type = 'number';
          } else if (typeof value === 'boolean') {
            type = 'boolean';
          } else if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
            type = 'datetime';
          }
          
          fields.push({ name: key, type });
        }
      }
      
      return fields;
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.initializeEntity();
        this.initializeMultiSelectFields();
      }
    },
    entity: {
      handler() {
        if (this.show) {
          this.initializeEntity();
          this.initializeMultiSelectFields();
        }
      },
      deep: true
    }
  },
  mounted() {
    if (this.show) {
      this.initializeEntity();
      this.initializeMultiSelectFields();
    }
  },
  beforeDestroy() {
    // Clean up debounce timers
    Object.keys(this.searchDebounce).forEach(key => {
      if (this.searchDebounce[key]) {
        clearTimeout(this.searchDebounce[key]);
      }
    });
  },
  methods: {
    initializeEntity() {
      if (this.entity) {
        // Editing existing entity - use Object.assign to preserve all properties
        this.localEntity = Object.assign({}, this.entity);
        
        // Apply field-specific default values from fieldDefinitions if not already set
        if (this.fieldDefinitions && Array.isArray(this.fieldDefinitions)) {
          this.fieldDefinitions.forEach(field => {
            if (field.defaultValue !== undefined && this.localEntity[field.name] === undefined) {
              this.localEntity[field.name] = field.defaultValue;
            }
          });
        }
      } else if (this.className) {
        // Creating new entity from class
        const ClassType = getClassByName(this.className);
        this.localEntity = new ClassType();
        
        // Apply defaults
        if (this.defaults && typeof this.defaults === 'object') {
          Object.assign(this.localEntity, this.defaults);
        }
        
        // Apply field-specific default values from fieldDefinitions
        if (this.fieldDefinitions && Array.isArray(this.fieldDefinitions)) {
          this.fieldDefinitions.forEach(field => {
            if (field.defaultValue !== undefined && this.localEntity[field.name] === undefined) {
              this.localEntity[field.name] = field.defaultValue;
            }
          });
        }
      } else {
        // Fallback to empty object
        this.localEntity = { ...this.defaults };
        
        // Apply field-specific defaults even for empty object
        if (this.fieldDefinitions && Array.isArray(this.fieldDefinitions)) {
          this.fieldDefinitions.forEach(field => {
            if (field.defaultValue !== undefined && this.localEntity[field.name] === undefined) {
              this.localEntity[field.name] = field.defaultValue;
            }
          });
        }
      }
    },
    
    initializeMultiSelectFields() {
      if (!this.fieldDefinitions) return;
      
      this.fieldDefinitions.forEach(field => {
        if (field.type === 'multi-select-table') {
          // Initialize search state for this field
          if (!this.searchQueries[field.name]) {
            this.$set(this.searchQueries, field.name, '');
          }
          if (!this.searchResults[field.name]) {
            this.$set(this.searchResults, field.name, []);
          }
          if (!this.searchLoading[field.name]) {
            this.$set(this.searchLoading, field.name, false);
          }
          // Ensure localEntity has array
          if (!Array.isArray(this.localEntity[field.name])) {
            this.$set(this.localEntity, field.name, []);
          }
        }
      });
    },
    
    formatFieldName(name) {
      // Convert camelCase or snake_case to Title Case
      return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    },
    
    getIconOptions(field) {
      // Return field-specific options or component-level iconOptions
      return field.options || this.iconOptions || [];
    },
    
    getIconKey(icon) {
      // Support both string and object formats
      return typeof icon === 'object' ? (icon.value || icon.fileName) : icon;
    },
    
    getIconValue(icon) {
      // Return the value (for objects) or the filename (for strings)
      return typeof icon === 'object' ? icon.value : icon;
    },
    
    getIconLabel(icon) {
      // Return the label (for objects) or the filename (for strings)
      return typeof icon === 'object' ? icon.label : icon;
    },
    
    getIconFileName(field, value) {
      // Find the fileName for the given value
      const options = this.getIconOptions(field);
      if (!options || options.length === 0) return value;
      
      // If options are objects, find the matching one
      const option = options.find(opt => {
        if (typeof opt === 'object') {
          return opt.value === value;
        }
        return opt === value;
      });
      
      if (option && typeof option === 'object') {
        return option.fileName;
      }
      
      return value; // fallback to value itself
    },
    
    getSelectedIconLabel(field, value) {
      // Find the label for the given value
      const options = this.getIconOptions(field);
      if (!options || options.length === 0) return value;
      
      const option = options.find(opt => {
        if (typeof opt === 'object') {
          return opt.value === value;
        }
        return opt === value;
      });
      
      if (option && typeof option === 'object') {
        return option.label;
      }
      
      return value; // fallback to value itself
    },
    
    getIconPath(iconName) {
      // Build the path to the icon asset
      if (!iconName) return '';
      try {
        const r = require(`@/assets/icons/${iconName}`);
        if (r) {
          return (typeof r === 'string') ? r : (r.default || r);
        }
      } catch (e) {
        console.warn(`Icon not found: ${iconName}`, e);
      }
      // Fallback to public-served path
      return `/assets/icons/${encodeURIComponent(iconName)}`;
    },
    
    // Multi-select table methods
    getMinSearchLength(field) {
      return (field.tableConfig && field.tableConfig.minSearchLength) || 3;
    },
    
    onSearchInput(field) {
      const query = this.searchQueries[field.name];
      const minLength = this.getMinSearchLength(field);
      
      // Clear previous debounce
      if (this.searchDebounce[field.name]) {
        clearTimeout(this.searchDebounce[field.name]);
      }
      
      if (query.length < minLength) {
        this.$set(this.searchResults, field.name, []);
        return;
      }
      
      // Debounce search
      this.searchDebounce[field.name] = setTimeout(() => {
        this.performSearch(field, query);
      }, 300);
    },
    
    async performSearch(field, query) {
      this.$set(this.searchLoading, field.name, true);
      
      try {
        let results = [];
        
        if (field.dataSource && field.dataSource.items) {
          // Option A: Local search
          results = this.searchLocalItems(field, query);
        } else if (field.dataSource && (field.dataSource.endpoint || field.dataSource.restModuleName)) {
          // Option B: Remote search
          results = await this.searchRemoteItems(field, query);
        }
        
        this.$set(this.searchResults, field.name, results);
      } catch (e) {
        console.error('Search failed:', e);
        this.$set(this.searchResults, field.name, []);
      } finally {
        this.$set(this.searchLoading, field.name, false);
      }
    },
    
    searchLocalItems(field, query) {
      const items = field.dataSource.items || [];
      const searchableColumns = field.tableConfig.displayColumns
        .filter(col => col.searchable)
        .map(col => col.colName);
      
      const lowerQuery = query.toLowerCase();
      
      return items.filter(item => {
        return searchableColumns.some(colName => {
          const value = String(item[colName] || '').toLowerCase();
          return value.includes(lowerQuery);
        });
      }).slice(0, field.tableConfig.maxResults || 20);
    },
    
    async searchRemoteItems(field, query) {
      const endpoint = field.dataSource.endpoint || 
                       `${field.dataSource.restModuleName}/getBySubstring`;
      const searchParam = field.dataSource.searchParam || 'searchFor';
      
      console.log('searchRemoteItems - endpoint:', endpoint, 'query:', query);
      
      const response = await axios.get(`${API_BASE_URL}/${endpoint}`, {
        params: {
          [searchParam]: query,
          limit: field.tableConfig.maxResults || 20
        }
      });
      
      console.log('searchRemoteItems - full response:', response);
      console.log('searchRemoteItems - response.data:', response.data);
      console.log('searchRemoteItems - typeof response.data:', typeof response.data);
      
      // Handle different response structures
      if (!response.data) {
        return [];
      }
      
      // If data is already an array, return it
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // If data has an items property, use that
      if (response.data.items && Array.isArray(response.data.items)) {
        return response.data.items;
      }
      
      // Fallback to empty array
      return [];
    },
    
    toggleItemSelection(field, item) {
      const idField = field.tableConfig.itemIdField;
      const selectedItems = this.localEntity[field.name] || [];
      const itemId = item[idField];
      
      const index = selectedItems.findIndex(i => i[idField] === itemId);
      
      if (index > -1) {
        // Remove
        selectedItems.splice(index, 1);
      } else {
        // Add
        selectedItems.push(item);
      }
      
      this.$set(this.localEntity, field.name, [...selectedItems]);
    },
    
    isItemSelected(field, item) {
      const idField = field.tableConfig.itemIdField;
      const selectedItems = this.localEntity[field.name] || [];
      return selectedItems.some(i => i[idField] === item[idField]);
    },
    
    removeItem(field, item) {
      const idField = field.tableConfig.itemIdField;
      const selectedItems = this.localEntity[field.name] || [];
      const filtered = selectedItems.filter(i => i[idField] !== item[idField]);
      this.$set(this.localEntity, field.name, filtered);
    },
    
    getSelectedItems(field) {
      return this.localEntity[field.name] || [];
    },
    
    getItemId(item, field) {
      const idField = field.tableConfig.itemIdField;
      return item[idField];
    },
    
    formatItemDisplay(item, field) {
      // Format display based on first 2-3 columns
      const cols = field.tableConfig.displayColumns.slice(0, 2);
      return cols.map(col => item[col.colName]).filter(Boolean).join(' ');
    },
    
    onSave() {
      this.$emit('save', this.localEntity);
    },
    
    onCancel() {
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
}

.modal-content {
  position: relative;
  background: #fff;
  max-width: 700px;
  width: calc(100% - 48px);
  max-height: 80vh;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  right: 16px;
  top: 16px;
  background: transparent;
  border: none;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
  line-height: 1;
}

.modal-close:hover {
  color: #000;
}

h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-field input[type="text"],
.form-field input[type="number"],
.form-field input[type="date"],
.form-field input[type="datetime-local"],
.form-field textarea,
.form-field select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.form-field input[type="text"]:focus,
.form-field input[type="number"]:focus,
.form-field input[type="date"]:focus,
.form-field input[type="datetime-local"]:focus,
.form-field textarea:focus,
.form-field select:focus {
  outline: none;
  border-color: #72ad45;
  box-shadow: 0 0 0 2px rgba(114, 173, 69, 0.1);
}

.form-field input[type="checkbox"] {
  width: auto;
  height: 18px;
  cursor: pointer;
}

.form-field textarea {
  resize: vertical;
  min-height: 60px;
}

.icon-select-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.icon-select {
  flex: 1;
}

.icon-preview {
  width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  padding: 4px;
}

.icon-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.modal-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-save {
  background: #72ad45;
  color: white;
}

.btn-save:hover {
  background: #5f9237;
}

/* Multi-select table styles */
.multi-select-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 40px;
}

.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #72ad45;
  color: white;
  border-radius: 16px;
  font-size: 13px;
  line-height: 1.4;
}

.selected-chip .remove-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  margin: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.selected-chip .remove-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #72ad45;
  box-shadow: 0 0 0 2px rgba(114, 173, 69, 0.1);
}

.results-table-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.results-table thead {
  position: sticky;
  top: 0;
  background: #f5f5f5;
  z-index: 1;
}

.results-table th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  color: #333;
}

.results-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
}

.results-table .checkbox-cell {
  text-align: center;
  padding: 8px;
}

.results-table tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}

.results-table tbody tr:hover {
  background: #f9f9f9;
}

.results-table tbody tr.selected {
  background: #e8f5e0;
}

.results-table tbody tr.selected:hover {
  background: #daf0ce;
}

.results-table input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.search-status {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 13px;
  font-style: italic;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}
</style>
