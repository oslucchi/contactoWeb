<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/MasterDataHandlers/Employees/EmployeesList.vue -->
<template>
  <div class="employees-bg" @click="deselectRow">
    <div class="employees-content">
      <h2>{{ $t('navigation.employees') }}</h2>
      <div class="action-icons">
        <SearchByString
          v-model="searchTerm"
          placeholder="Search employees..."
          @input="onSearchInput"
        />
        <button :disabled="selectedRow === null" @click.stop="openEditModal">
          <img src="@/assets/icons/pencil.png" alt="Edit" class="icon" />
        </button>
        <button :disabled="selectedRow === null" @click.stop="deleteSelectedRow">
          <img src="@/assets/icons/recycle-bin.png" alt="Delete" class="icon" />
        </button>
        <button @click.stop="addNewEmployee">
          <img src="@/assets/icons/add.png" alt="Add" class="icon" />
        </button>
      </div>
      <div class="table-container">
        <table class="employees-table" @click.stop>
        <thead>
          <tr>
            <th>{{ $t('forms.placeholders.familyName') }}</th>
            <th>{{ $t('forms.placeholders.firstName') }}</th>
            <th>{{ $t('forms.placeholders.email') }}</th>
            <th>{{ $t('forms.placeholders.mobile') }}</th>
            <th>Branch ID</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(employee, rowIdx) in employees"
            :key="employee.idEmployee"
            :class="{ 'row-selected': selectedRow === rowIdx }"
          >
            <td
              class="familyName"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'familyName' }"
              @click="selectCell(rowIdx, 'familyName')"
            >
              <input v-model="employee.familyName" @change="saveEmployee(employee)" type="text" class="table-input" />
            </td>
            <td
              class="firstName"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'firstName' }"
              @click="selectCell(rowIdx, 'firstName')"
            >
              <input v-model="employee.firstName" @change="saveEmployee(employee)" type="text" class="table-input" />
            </td>
            <td
              class="email"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'email' }"
              @click="selectCell(rowIdx, 'email')"
            >
              <input v-model="employee.email" @change="saveEmployee(employee)" type="text" class="table-input" />
            </td>
            <td
              class="mobile"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'mobile' }"
              @click="selectCell(rowIdx, 'mobile')"
            >
              <input v-model="employee.mobile" @change="saveEmployee(employee)" type="text" class="table-input" />
            </td>
            <td
              class="idBranch"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'idBranch' }"
              @click="selectCell(rowIdx, 'idBranch')"
            >
              <input v-model.number="employee.idBranch" @change="saveEmployee(employee)" type="number" class="table-input" />
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      <!-- Edit Modal Placeholder -->
      <div v-if="showEditModal" class="modal-overlay" @click.stop>
        <div class="modal-content">
          <button class="modal-close" @click="showEditModal = false">X</button>
          <h3>Edit Employee</h3>
          <div>
            <!-- Placeholder for future form -->
            <pre>{{ selectedEmployee }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import SearchByString from '@/components/SearchByString.vue';

export default {
  components: {
    SearchByString
  },
  data() {
    return {
      employees: [],
      selectedRow: null,
      selectedCell: null,
      showEditModal: false,
      selectedEmployee: null,
      searchTerm: '',
    };
  },
  created() {
    this.loadEmployees();
  },
  methods: {
    loadEmployees() {
      const endpoint = this.searchTerm ? 
        `${API_BASE_URL}/employees/search?searchFor=${this.searchTerm}` : 
        `${API_BASE_URL}/employees`;
      axios.get(endpoint).then(res => {
        this.employees = res.data;
      });
    },
    onSearchInput(value) {
      this.searchTerm = value || '';
      this.loadEmployees();
    },
    async saveEmployee(employee) {
      try {
        await axios.put(`${API_BASE_URL}/employees/${employee.idEmployee}`, employee);
      } catch (e) {
        alert('Error saving employee');
      }
    },
    selectCell(rowIdx, cellName) {
      this.selectedRow = rowIdx;
      this.selectedCell = cellName;
      this.selectedEmployee = this.employees[rowIdx];
    },
    openEditModal() {
      if (this.selectedRow !== null) {
        this.selectedEmployee = this.employees[this.selectedRow];
        this.showEditModal = true;
      }
    },
    deleteSelectedRow() {
      if (this.selectedRow !== null) {
        const employee = this.employees[this.selectedRow];
        if (confirm(`Delete employee ${employee.firstName} ${employee.familyName}?`)) {
          axios.delete(`${API_BASE_URL}/employees/${employee.idEmployee}`).then(() => {
            this.employees.splice(this.selectedRow, 1);
            this.selectedRow = null;
            this.selectedCell = null;
            this.selectedEmployee = null;
          });
        }
      }
    },
    addNewEmployee() {
      const newEmployee = {
        idEmployee: Date.now(),
        idBranch: '',
        familyName: '',
        firstName: '',
        email: '',
        mobile: ''
      };
      this.employees.push(newEmployee);
      this.selectedRow = this.employees.length - 1;
      this.selectedCell = 'familyName';
      this.selectedEmployee = newEmployee;
    },
    deselectRow() {
      this.selectedRow = null;
      this.selectedCell = null;
      this.selectedEmployee = null;
    }
  }
}
</script>

<style scoped>
.employees-bg {
  min-height: 100vh;
  width: 100vw;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.employees-content {
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
  border: 1px solid #ddd;
  margin-top: 16px;
}
.employees-table {
  width: 100%;
  border-collapse: collapse;
}
.employees-table th, .employees-table td {
  border: 1px solid #888;
  padding: 6px 8px;
  text-align: left;
}
.employees-table th {
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
.employees-table td.idBranch {
  width: 100px;
  max-width: 100px;
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