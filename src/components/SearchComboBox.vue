<template>
  <div v-if="modal" class="search-modal-overlay">
    <div class="search-modal-content">
      <button class="modal-close" @click="$emit('close')">X</button>
      <div class="search-label" v-if="label">{{ label }}</div>
      <div class="search-desc">search in: {{ searchColumns.join(', ') }}</div>

      <!-- Current Items Table -->
      <div class="table-section">
        <div class="table-title">Attuali</div>
        <table class="combo-table">
          <thead>
            <tr>
              <th></th>
              <th v-for="col in displayColumns" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in localCurrentItems" :key="item.idPerson">
              <td>
                <input
                  type="checkbox"
                  :checked="isSelected(item)"
                  @change="toggleItem(item, $event)"
                />
              </td>
              <td v-for="col in displayColumns" :key="col">{{ item[col] }}</td>
            </tr>
            <tr v-if="localCurrentItems.length === 0">
              <td :colspan="displayColumns.length + 1" class="empty-row">Nessun elemento</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Search Input -->
      <input v-model="search" @input="onInput" placeholder="Cerca..." />

      <!-- Search Results Table -->
      <div class="table-section">
        <div class="table-title">Risultati ricerca</div>
        <table class="combo-table">
          <thead>
            <tr>
              <th></th>
              <th v-for="col in displayColumns" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in results" :key="item.idPerson">
              <td>
                <input
                  type="checkbox"
                  :checked="isSelected(item)"
                  @change="toggleItem(item, $event)"
                />  
              </td>
              <td v-for="col in displayColumns" :key="col">{{ item[col] }}</td>
            </tr>
            <tr v-if="results.length === 0 && search.length >= 3">
              <td :colspan="displayColumns.length + 1" class="empty-row">Nessun risultato</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';

export default {
  props: {
    modal: { type: Boolean, default: false },
    value: [String, Object, Number],
    label: String,
    table: { type: String, required: true },
    searchColumns: { type: Array, required: true },
    displayColumns: { type: Array, required: true },
    currentItems: { type: Array, default: () => [] }, // Array of objects already present
    addApi: { type: String, required: false }, // API endpoint for add
    deleteApi: { type: String, required: false } // API endpoint for delete
  },
  data() {
    return {
      search: '',
      results: [],
      showDropdown: false,
      searchTimeout: null,
      localCurrentItems: [...this.currentItems], // local copy for UI update
      selectedIds: [] // for multi-select
    };
  },
  watch: {
    currentItems(newVal) {
      this.localCurrentItems = [...newVal];
    }
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
      try {
        const res = await axios.post(
          `${API_BASE_URL}/utility/searchBox${this.table}`,
          {
            searchFor: this.search
          }
        );
        this.results = res.data || [];
      } catch (e) {
        this.results = [];
      }
      this.showDropdown = true;
    },
    isSelected(item) {
      return this.localCurrentItems.some(i => i.idPerson === item.idPerson);
    },
    async toggleItem(item, event) {
      if (event.target.checked) {
        // Add
        if (this.addApi && !this.isSelected(item)) {
          try {
            await axios.post(this.addApi + item.idPerson);
            this.localCurrentItems.push(item);
            this.$emit('update:currentItems', this.localCurrentItems);
            this.results = [...this.results];
          } catch (e) {
            alert('Errore durante l\'aggiunta');
            event.target.checked = false;
          }
        }
      } else {
        // Remove
        if (this.deleteApi && this.isSelected(item)) {
          try {
            await axios.post(this.deleteApi + item.idPerson);
            this.localCurrentItems = this.localCurrentItems.filter(i => i.idPerson !== item.idPerson);
            this.$emit('update:currentItems', this.localCurrentItems);
            this.results = [...this.results];
          } catch (e) {
            alert('Errore durante la rimozione');
            event.target.checked = true;
          }
        }
      }
    }
  }
};
</script>

<style>
.search-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.search-modal-content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  min-width: 420px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  position: relative;
}
.modal-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: transparent;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
}
.search-label {
  text-align: center;
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 2px;
}
.search-desc {
  text-align: center;
  font-size: 0.92em;
  color: #666;
  margin-bottom: 8px;
}
.table-section {
  margin: 12px 0;
}
.table-title {
  font-size: 1em;
  font-weight: bold;
  margin-bottom: 4px;
}
.combo-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 8px;
}
.combo-table th, .combo-table td {
  border: 1px solid #bbb;
  padding: 4px 8px;
  text-align: left;
  font-size: 0.98em;
}
.combo-table th {
  background: #f5f5f5;
}
.empty-row {
  text-align: center;
  color: #aaa;
}
</style>