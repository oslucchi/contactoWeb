<!-- filepath: /share/sources/Contacto/cantactoWeb/src/components/SearchComboBox.vue -->
<template>
  <div class="search-combo">
    <label v-if="label">{{ label }}</label>
    <input
      v-model="search"
      @input="onInput"
      :placeholder="label || 'Cerca...'"
      autocomplete="off"
    />
    <ul v-if="showDropdown" class="combo-dropdown">
      <li v-for="item in results" :key="item.id" @click="select(item)">
        <span v-for="col in displayColumns" :key="col" class="combo-cell">{{ item[col] }}</span>
      </li>
    </ul>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  props: {
    value: [String, Object, Number],
    label: String,
    table: { type: String, required: true },
    searchColumns: { type: Array, required: true },
    displayColumns: { type: Array, required: true }
  },
  data() {
    return {
      search: '',
      results: [],
      showDropdown: false,
      searchTimeout: null
    };
  },
  methods: {
    onInput() {
      clearTimeout(this.searchTimeout);
      if (this.search.length < 3) {
        this.results = [];
        this.showDropdown = false;
        return;
      }
      this.searchTimeout = setTimeout(this.fetchResults, 400);
    },
    async fetchResults() {
      // Mocked API call, replace with your endpoint
      // The payload: { table, searchColumns, displayColumns, searchFor: this.search }
      // Example:
      // const res = await axios.post('/api/searchCombo', { table: this.table, searchColumns: this.searchColumns, displayColumns: this.displayColumns, searchFor: this.search });
      // this.results = res.data || [];
      // For now, mock:
      this.results = [
        { id: 1, name: 'Demo 1', extra: 'A' },
        { id: 2, name: 'Demo 2', extra: 'B' }
      ];
      this.showDropdown = true;
    },
    select(item) {
      this.$emit('input', item);
      this.search = this.displayColumns.map(col => item[col]).join(' ');
      this.showDropdown = false;
    }
  }
};
</script>
<style>
.search-combo {
  position: relative;
  margin-bottom: 12px;
}
.combo-dropdown {
  position: absolute;
  left: 0; right: 0;
  background: #fff;
  border: 1px solid #bbb;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  z-index: 1200;
  margin-top: 2px;
  list-style: none;
  padding: 0;
  font-size: 0.95em;
}
.combo-dropdown li {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
}
.combo-dropdown li:hover {
  background: #e3f2fd;
}
.combo-cell {
  min-width: 60px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
</style>