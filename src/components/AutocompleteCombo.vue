<!-- filepath: /share/sources/Contacto/cantactoWeb/src/components/AutocompleteCombo.vue -->
<template>
  <div class="autocomplete-wrapper" v-click-outside="closeDropdown">
    <input
      ref="input"
      type="text"
      v-model="searchText"
      @input="onInput"
      @focus="onFocus"
      @keydown.down.prevent="navigateDown"
      @keydown.up.prevent="navigateUp"
      @keydown.enter.prevent="selectHighlighted"
      @keydown.esc="closeDropdown"
      :placeholder="placeholder"
      class="autocomplete-input"
    />
    
    <div v-if="showDropdown && (results.length > 0 || isLoading)" class="autocomplete-dropdown">
      <div v-if="isLoading" class="dropdown-item loading">Loading...</div>
      <div
        v-else
        v-for="(item, idx) in results"
        :key="getItemId(item)"
        :class="['dropdown-item', { highlighted: idx === highlightedIndex }]"
        @click="selectItem(item)"
        @mouseenter="highlightedIndex = idx"
      >
        <span v-for="col in displayColumns" :key="col" class="dropdown-col">
          {{ item[col] }}
        </span>
      </div>
      <div v-if="!isLoading && results.length === 0 && searchText.length >= minChars" class="dropdown-item empty">
        No results found
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';

export default {
  name: 'AutocompleteCombo',
  props: {
    value: [String, Number, Object], // The current selected value
    placeholder: { type: String, default: 'Type to search...' },
    table: { type: String, required: true }, // e.g., 'Company', 'Person'
    searchColumns: { type: Array, required: true }, // columns to search in on backend
    displayColumns: { type: Array, required: true }, // columns to display in dropdown
    idField: { type: String, default: 'id' }, // which field is the ID
    labelField: { type: String, required: true }, // which field to display as selected text
    minChars: { type: Number, default: 3 }
  },
  directives: {
    'click-outside': {
      bind(el, binding) {
        el._clickOutside = (event) => {
          if (!el.contains(event.target)) {
            binding.value();
          }
        };
        document.addEventListener('click', el._clickOutside);
      },
      unbind(el) {
        document.removeEventListener('click', el._clickOutside);
      }
    }
  },
  data() {
    return {
      searchText: '',
      results: [],
      showDropdown: false,
      searchTimeout: null,
      highlightedIndex: -1,
      isLoading: false,
      selectedItem: null
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newVal) {
        if (newVal && typeof newVal === 'object') {
          this.selectedItem = newVal;
          this.searchText = newVal[this.labelField] || '';
        } else if (newVal) {
          // If value is just an ID, fetch the item
          this.fetchItemById(newVal);
        } else {
          this.searchText = '';
          this.selectedItem = null;
        }
      }
    }
  },
  methods: {
    onInput() {
      clearTimeout(this.searchTimeout);
      
      if (this.searchText.length < this.minChars) {
        this.results = [];
        this.showDropdown = false;
        return;
      }
      
      this.searchTimeout = setTimeout(this.fetchResults, 300);
    },

    onFocus() {
      if (this.searchText.length >= this.minChars && this.results.length > 0) {
        this.showDropdown = true;
      }
    },

    async fetchResults() {
      this.isLoading = true;
      try {
        const payload = {
          searchFor: this.searchText,
          searchTable: this.table,
          searchColumns: this.searchColumns
        };
        const res = await axios.post(
            `${API_BASE_URL}/utility/searchBox`,
            payload
        );
        this.results = res.data || [];
        this.showDropdown = true;
        this.highlightedIndex = this.results.length > 0 ? 0 : -1;
      } catch (e) {
        console.error('Autocomplete fetch error:', e);
        this.results = [];
      } finally {
        this.isLoading = false;
      }
    },

    async fetchItemById(id) {
      try {
        // This assumes an endpoint exists - adjust as needed
        const res = await axios.get(`${API_BASE_URL}/${this.table.toLowerCase()}s/${id}`);
        this.selectedItem = res.data;
        this.searchText = res.data[this.labelField] || '';
      } catch (e) {
        console.error('Fetch by ID error:', e);
        this.searchText = String(id);
      }
    },

    selectItem(item) {
      this.selectedItem = item;
      this.searchText = item[this.labelField] || '';
      this.showDropdown = false;
      this.results = [];
      this.$emit('input', item);
      this.$emit('select', item);
    },

    selectHighlighted() {
      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.results.length) {
        this.selectItem(this.results[this.highlightedIndex]);
      }
    },

    navigateDown() {
      if (!this.showDropdown) return;
      this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.results.length - 1);
    },
    navigateUp() {
      if (!this.showDropdown) return;
      this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
    },
    closeDropdown() {
      this.showDropdown = false;
      this.highlightedIndex = -1;
    },
    getItemId(item) {
      return item[this.idField];
    }
  }
};
</script>

<style scoped>
.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.autocomplete-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
  color: #333;
  margin: 0;
}

.autocomplete-input:focus {
  border-color: #4CAF50;
  background: #fff;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #0288d1;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 2000;
  max-height: 320px;
  overflow-y: auto;
  margin-top: 4px;
}

.dropdown-item {
  padding: 5px 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 12px;
  font-size: 14px;
  line-height: 1.3;
  min-height: 22px;
  align-items: center;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover,
.dropdown-item.highlighted {
  background: #e3f2fd;
}

.dropdown-item.loading,
.dropdown-item.empty {
  color: #999;
  cursor: default;
  justify-content: center;
}

.dropdown-item.loading:hover,
.dropdown-item.empty:hover {
  background: #fff;
}

.dropdown-col {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
