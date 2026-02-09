<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/MasterDataHandlers/Persons/PersonsList.vue -->
<template>
  <div class="persons-bg" @click="deselectRow">
    <div class="persons-content">
      <h2>Persons</h2>
      <div class="action-icons">
        <SearchByString
          v-model="searchTerm"
          placeholder="Search persons..."
          @input="onSearchInput"
        />
        <button :disabled="selectedRow === null" @click.stop="openEditModal">
          <img src="@/assets/icons/pencil.png" alt="Edit" class="icon" />
        </button>
        <button :disabled="selectedRow === null" @click.stop="deleteSelectedRow">
          <img src="@/assets/icons/recycle-bin.png" alt="Delete" class="icon" />
        </button>
        <button @click.stop="addNewPerson">
          <img src="@/assets/icons/add.png" alt="Add" class="icon" />
        </button>
      </div>
      <div class="table-container">
        <table class="persons-table" @click.stop>
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :class="col.key" @click.stop="col.sortable && handleSort(col.key)">
              {{ col.label }}
              <span v-if="col.sortable && sortColumn === col.key" class="sort-arrow">
                <span v-if="sortDirection === 'asc'">&#8595;</span>
                <span v-else-if="sortDirection === 'desc'">&#8593;</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(person, rowIdx) in sortedPersons"
            :key="person.idPerson"
            :class="{ 'row-selected': selectedRow === rowIdx }"
          >
            <td
              class="first-name"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'first-name' }"
              @click="selectCell(rowIdx, 'first-name')"
            >
              <input 
                v-model="person.firstName" 
                @change="savePerson(person)" 
                @keydown.tab="handleTab(rowIdx, 'first-name', $event)"
                type="text" 
                class="table-input" 
              />
            </td>
            <td
              class="family-name"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'family-name' }"
              @click="selectCell(rowIdx, 'family-name')"
            >
              <input 
                v-model="person.familyName" 
                @change="savePerson(person)" 
                @keydown.tab="handleTab(rowIdx, 'family-name', $event)"
                type="text" 
                class="table-input" 
              />
            </td>
            <td
              class="company"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'company' }"
              @click="selectCell(rowIdx, 'company')"
            >
              <AutocompleteCombo
                v-if="selectedRow === rowIdx && selectedCell === 'company'"
                ref="companyCombo"
                v-model="person.companyObj"
                table="Companies"
                :searchColumns="['description']"
                :displayColumns="['description']"
                idField="idCompany"
                labelField="description"
                placeholder="Type company name..."
                @select="onCompanySelect(person, $event)"
                @keydown.tab.native="handleTab(rowIdx, 'company', $event)"
                @blur.native="clearSelection"
              />
              <span v-else>{{ getCompanyName(person) }}</span>
            </td>
            <td
              class="email"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'email' }"
              @click="selectCell(rowIdx, 'email')"
            >
              <input 
                v-model="person.email" 
                @change="savePerson(person)" 
                @keydown.tab="handleTab(rowIdx, 'email', $event)"
                type="email" 
                class="table-input" 
              />
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      <!-- Edit Modal Placeholder -->
      <div v-if="showEditModal" class="modal-overlay" @click.stop>
        <div class="modal-content">
          <button class="modal-close" @click="showEditModal = false">X</button>
          <h3>Edit Person</h3>
          <div>
            <pre>{{ selectedPerson }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import Person from '@/types/Person';
import SearchByString from '@/components/SearchByString.vue';
import AutocompleteCombo from '@/components/AutocompleteCombo.vue';

export default {
  components: {
    SearchByString,
    AutocompleteCombo
  },
  data() {
    return {
      persons: [],
      selectedRow: null,
      selectedCell: null,
      showEditModal: false,
      selectedPerson: null,
      searchTerm: '',
      sortColumn: null,
      sortDirection: null,
      columns: [
        { key: 'firstName', label: 'First Name', sortable: true },
        { key: 'familyName', label: 'Family Name', sortable: true },
        { key: 'company', label: 'Company', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
      ],
    };
  },
  computed: {
    sortedPersons() {
      if (!this.sortColumn || !this.sortDirection) return this.persons;
      let sorted = [...this.persons];
      sorted.sort((a, b) => {
        let valA = a[this.sortColumn] || '';
        let valB = b[this.sortColumn] || '';
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted;
    }
  },
  created() {
    this.loadPersons();
  },
  methods: {
    loadPersons() {
      axios.get(`${API_BASE_URL}/persons/getBySubstring?searchFor=${this.searchTerm}`).then(res => {
        this.persons = res.data;
        this.enrichPersonsWithCompanyData();
      });
    },
    onSearchInput(value) {
      this.searchTerm = value || '';
      this.loadPersons();
    },
    savePerson(person) {
      axios.put(`${API_BASE_URL}/persons/${person.idPerson}`, person)
        .catch(() => alert('Error saving person'));
    },
    selectCell(rowIdx, cellName) {
      this.selectedRow = rowIdx;
      this.selectedCell = cellName;
      this.selectedPerson = this.persons[rowIdx];
      
      // Auto-focus the input when selecting company cell
      if (cellName === 'company') {
        this.$nextTick(() => {
          // Find the autocomplete input in the selected cell
          const selectedCell = document.querySelector('.cell-selected .autocomplete-input');
          if (selectedCell) {
            selectedCell.focus();
          }
        });
      }
    },
    openEditModal() {
      if (this.selectedRow !== null) {
        this.selectedPerson = this.persons[this.selectedRow];
        this.showEditModal = true;
      }
    },
    deleteSelectedRow() {
      if (this.selectedRow !== null) {
        const person = this.persons[this.selectedRow];
        if (confirm(`Delete person ${person.familyName} ${person.firstName} of ${person.company}?`)) {
          axios.delete(`${API_BASE_URL}/persons/${person.idPerson}`).then(() => {
            this.persons.splice(this.selectedRow, 1);
            this.selectedRow = null;
            this.selectedCell = null;
            this.selectedPerson = null;
          });
        }
      }
    },
    async addNewPerson() {
      const newPerson = new Person();
      await axios.post(`${API_BASE_URL}/persons/create`, newPerson)
        .then(res => {
          this.persons.push(res.data);
        }
      );
      this.selectedRow = this.persons.length - 1;
      this.selectedCell = 'firstName';
      this.selectedPerson = newPerson;
    },
    deselectRow() {
      this.selectedRow = null;
      this.selectedCell = null;
      this.selectedPerson = null;
    },
    handleSort(column) {
      if (this.sortColumn !== column) {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      } else if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortColumn = null;
        this.sortDirection = null;
      } else {
        this.sortDirection = 'asc';
      }
    },
    onCompanySelect(person, companyObj) {
      person.idCompany = companyObj.idCompany;
      person.company = companyObj.description;
      person.companyObj = companyObj;
      this.savePerson(person);
    },
    handleTab(rowIdx, currentCell, event) {
      event.preventDefault();
      
      const cellOrder = ['first-name', 'family-name', 'company', 'email'];
      const currentIndex = cellOrder.indexOf(currentCell);
      
      if (currentIndex < cellOrder.length - 1) {
        // Move to next cell in same row
        this.selectedRow = rowIdx;
        this.selectedCell = cellOrder[currentIndex + 1];
      } else {
        // Last cell in row, move to first cell of next row
        if (rowIdx < this.sortedPersons.length - 1) {
          this.selectedRow = rowIdx + 1;
          this.selectedCell = cellOrder[0];
        } else {
          // Last cell of last row, deselect
          this.selectedRow = null;
          this.selectedCell = null;
          return;
        }
      }
      
      // Focus the next input
      this.$nextTick(() => {
        const selector = this.selectedCell === 'company' 
          ? '.cell-selected .autocomplete-input'
          : '.cell-selected .table-input';
        const nextInput = document.querySelector(selector);
        if (nextInput) {
          nextInput.focus();
        }
      });
    },
    clearSelection() {
      // Clear after a short delay to allow selection to complete if needed
      setTimeout(() => {
        this.selectedCell = null;
      }, 150);
    },
    getCompanyName(person) {
      if (person.companyObj && person.companyObj.description) {
        return person.companyObj.description;
      }
      return person.company || '';
    },
    async enrichPersonsWithCompanyData() {
      // Fetch company details for persons that have a company ID
      const companyIds = [...new Set(this.persons.map(p => p.idCompany).filter(Boolean))];
      
      for (const companyId of companyIds) {
        try {
          const res = await axios.get(`${API_BASE_URL}/companies/${companyId}`);
          // Attach company object to all persons with this company ID
          this.persons.forEach(person => {
            if (person.idCompany === companyId) {
              this.$set(person, 'companyObj', res.data);
            }
          });
        } catch (e) {
          console.error(`Failed to fetch company ${companyId}`, e);
        }
      }
    }
  }
}
</script>

<style scoped>
.sort-arrow {
  position: absolute;
  right: 6px;
  bottom: 2px;
  font-size: 1em;
  color: #222;
  pointer-events: none;
}
.persons-table th {
  position: relative;
  cursor: pointer;
  user-select: none;
}
.persons-bg {
  min-height: 100vh;
  width: 100vw;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.persons-content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 40px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  overflow: hidden;
}
.table-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #ddd;
  margin-top: 16px;
}
.persons-table {
  width: 100%;
  border-collapse: collapse;
}
.persons-table th, .persons-table td {
  border: 1px solid #888;
  padding: 6px 8px;
  text-align: left;
}
.persons-table th {
  background: #f0f0f0;
}
.table-input {
  width: 100%;
  box-sizing: border-box;
  padding: 4px;
  background: #fff;
  border: none;
  outline: none;
}
.table-input:focus {
  background: #e6f0ff;
}
.action-icons {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}
.row-selected > td {
  background: #e0f7fa !important;
}
.cell-selected {
  background: #b3e5fc !important;
  box-shadow: 0 0 0 2px #0288d1 inset;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  min-width: 320px;
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
</style>