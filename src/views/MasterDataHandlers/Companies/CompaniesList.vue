<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/MasterDataHandlers/Companies/CompaniesList.vue -->
<template>
  <div class="companies-bg" @click="deselectRow">
    <div class="companies-content">
      <h2>Companies</h2>
      <div class="action-icons">
        <button :disabled="selectedRow === null" @click.stop="openEditModal">
          <img src="@/assets/icons/pencil.png" alt="Edit" class="icon" />
        </button>
        <button :disabled="selectedRow === null" @click.stop="deleteSelectedRow">
          <img src="@/assets/icons/recycle-bin.png" alt="Delete" class="icon" />
        </button>
        <button @click.stop="addNewCompany">
          <img src="@/assets/icons/add.png" alt="Add" class="icon" />
        </button>
      </div>
      <table class="companies-table" @click.stop>
        <thead>
          <tr>
            <th>Name</th>
            <th>Segment</th>
            <th>Branches</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(company, rowIdx) in companies"
            :key="company.idCompany"
            :class="{ 'row-selected': selectedRow === rowIdx }"
          >
            <td
              class="description"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'name' }"
              @click="selectCell(rowIdx, 'description')"
            >
              <input v-model="company.description" @change="saveCompany(company)" type="text" class="table-input" />
            </td>
            <td
              class="segment"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'segment' }"
              @click="selectCell(rowIdx, 'segment')"
            >
              <template v-if="selectedRow === rowIdx && selectedCell === 'segment'">
                <select
                  :value="getSegmentId(company.segment)"
                  @change="handleSegmentChange(rowIdx, $event)"
                  class="table-input"
                >
                  <option v-for="segment in segments" :key="segment.idSegment" :value="segment.idSegment">
                    {{ segment.description }}
                  </option>
                </select>
              </template>
              <template v-else>
                {{ company.segment }}
              </template>
            </td>
            <td class="branches">
              <span v-for="(branch, bIdx) in company.branches" :key="bIdx">
                  <a href="#" @click.stop.prevent="openBranchModal(branch)">
                    {{ (branch.name1 === "" ? company.description : branch.name1) }} - {{ branch.city }}
                  </a>
                  <br>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Edit Modal Placeholder -->
      <div v-if="showEditModal" class="modal-overlay" @click.stop>
        <div class="modal-content">
          <button class="modal-close" @click="showEditModal = false">X</button>
          <h3>Edit Company</h3>
          <div>
            <pre>{{ selectedCompany }}</pre>
          </div>
        </div>
      </div>
      <!-- Branch Details Modal -->
      <div v-if="showBranchModal" class="modal-overlay" @click.stop>
        <div class="modal-content">
          <button class="modal-close" @click="showBranchModal = false">X</button>
          <h3>Branch Details</h3>
          <div>
            <pre>{{ selectedBranch }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import Company from '@/types/Company';
import LookupData from '@/services/LookupDataInitializer';

export default {
  data() {
    return {
      companies: [],
      selectedRow: null,
      selectedCell: null,
      showEditModal: false,
      selectedCompany: null,
      showBranchModal: false,
      selectedBranch: null,
    };
  },
  computed: {
      segments() {
        return LookupData.segments;
      },
      branchTypes() {
        return LookupData.branchTypes;
      }
  },
  created() {
    axios.get(`${API_BASE_URL}/companies/getBySubstring?searchFor=`).then(res => {
      // Ensure each company is an instance of Company
      this.companies = res.data.map(c => c instanceof Company ? c : new Company(c));
    });
  },
  methods: {
    formatDateForInput(dateStr) {
      if (!dateStr) return '';
      return dateStr.slice(0, 10);
    },
    async saveCompany(company) {
      try {
        await axios.put(`${API_BASE_URL}/companies/${company.idCompany}`, company);
      } catch (e) {
        alert('Error saving company');
      }
    },
    selectCell(rowIdx, cellName) {
      this.selectedRow = rowIdx;
      this.selectedCell = cellName;
      this.selectedCompany = this.companies[rowIdx];
    },
    openEditModal() {
      if (this.selectedRow !== null) {
        this.selectedCompany = this.companies[this.selectedRow];
        this.showEditModal = true;
      }
    },
    deleteSelectedRow() {
      if (this.selectedRow !== null) {
        const company = this.companies[this.selectedRow];
        if (confirm(`Delete company ${company.name}?`)) {
          axios.delete(`${API_BASE_URL}/companies/${company.idCompany}`).then(() => {
            this.companies.splice(this.selectedRow, 1);
            this.selectedRow = null;
            this.selectedCell = null;
            this.selectedCompany = null;
          });
        }
      }
    },
    addNewCompany() {
      const newCompany = new Company();
      this.companies.push(newCompany);
      this.selectedRow = this.companies.length - 1;
      this.selectedCell = 'name';
      this.selectedCompany = newCompany;
    },
    deselectRow() {
      this.selectedRow = null;
      this.selectedCell = null;
      this.selectedCompany = null;
      this.showBranchModal = false;
      this.selectedBranch = null;
    },
    openBranchModal(branch) {
      this.selectedBranch = branch;
      this.showBranchModal = true;
    },
    handleSegmentChange(rowIdx, event) {
      const selectedId = Number(event.target.value);
      const selectedSegment = this.segments.find(s => s.idSegment === selectedId);
      if (selectedSegment) {
        this.companies[rowIdx].segment = selectedSegment.description;
        this.companies[rowIdx].idSegment = selectedSegment.idSegment;
        this.saveCompany(this.companies[rowIdx]);
      }
      this.selectedCell = null; // Optionally close dropdown after selection
    },
    getSegmentId(segmentDescription) {
      const seg = this.segments.find(s => s.description === segmentDescription);
      return seg ? seg.idSegment : '';
    }
  }
}
</script>

<style scoped>
.companies-bg {
  min-height: 100vh;
  width: 100vw;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.companies-content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 40px;
}
.companies-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}
.companies-table th, .companies-table td {
  border: 1px solid #888;
  padding: 6px 8px;
  text-align: left;
}
.companies-table th {
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
.companies-table td.description {
  width: 400px;
  max-width: 400px;
}
.companies-table td.segment {
  width: 200px;
  max-width: 200px;
}
.companies-table td.branches {
  width: 600px;
  max-width: 600px;
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
.companies-table td.branches a {
  color: #1976d2;
  text-decoration: underline;
  cursor: pointer;
  margin-right: 4px;
}
</style>