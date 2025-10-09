<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/MasterDataHandlers/Persons/PersonsList.vue -->
<template>
  <div class="persons-bg" @click="deselectRow">
    <div class="persons-content">
      <h2>Persons</h2>
      <div class="action-icons">
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
      <table class="persons-table" @click.stop>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Family Name</th>
            <th>Company</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(person, rowIdx) in persons"
            :key="person.idPerson"
            :class="{ 'row-selected': selectedRow === rowIdx }"
          >
            <td
              class="first-name"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'first-name' }"
              @click="selectCell(rowIdx, 'first-name')"
            >
              <input v-model="person.firstName" @change="savePerson(person)" type="text" class="table-input" />
            </td>
            <td
              class="family-name"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'family-name' }"
              @click="selectCell(rowIdx, 'family-name')"
            >
              <input v-model="person.familyName" @change="savePerson(person)" type="text" class="table-input" />
            </td>
            <td
              class="company"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'company' }"
              @click="selectCell(rowIdx, 'company')"
            >
              <input v-model="person.company" @change="savePerson(person)" type="text" class="table-input" />
            </td>
            <td
              class="email"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'email' }"
              @click="selectCell(rowIdx, 'email')"
            >
              <input v-model="person.email" @change="savePerson(person)" type="email" class="table-input" />
            </td>
          </tr>
        </tbody>
      </table>
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

export default {
  data() {
    return {
      persons: [],
      selectedRow: null,
      selectedCell: null,
      showEditModal: false,
      selectedPerson: null,
    };
  },
  created() {
    axios.get(`${API_BASE_URL}/persons/getBySubstring?searchFor=`).then(res => {
      this.persons = res.data;
    });
  },
  methods: {
    formatDateForInput(dateStr) {
      if (!dateStr) return '';
      return dateStr.slice(0, 10);
    },
    async savePerson(person) {
      try {
        await axios.put(`${API_BASE_URL}/persons/${person.idPerson}`, person);
      } catch (e) {
        alert('Error saving person');
      }
    },
    selectCell(rowIdx, cellName) {
      this.selectedRow = rowIdx;
      this.selectedCell = cellName;
      this.selectedPerson = this.persons[rowIdx];
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
        if (confirm(`Delete person ${person.familyName}?`)) {
          axios.delete(`${API_BASE_URL}/persons/${person.idPerson}`).then(() => {
            this.persons.splice(this.selectedRow, 1);
            this.selectedRow = null;
            this.selectedCell = null;
            this.selectedPerson = null;
          });
        }
      }
    },
    addNewPerson() {
      const newPerson = {
        idPerson: Date.now(),
        firstName: '',
        familyName: '',
        company: '',
        email: '',
        created: '',
        lastUpdate: ''
      };
      this.persons.push(newPerson);
      this.selectedRow = this.persons.length - 1;
      this.selectedCell = 'first-name';
      this.selectedPerson = newPerson;
    },
    deselectRow() {
      this.selectedRow = null;
      this.selectedCell = null;
      this.selectedPerson = null;
    }
  }
}
</script>

<style scoped>
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
}
.persons-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
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
.persons-table td.company,
.persons-table td.created,
.persons-table td.last-update {
  width: 140px;
  min-width: 120px;
  max-width: 180px;
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