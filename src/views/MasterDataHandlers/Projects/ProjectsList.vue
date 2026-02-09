<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/MasterDataHandlers/Projects/ProjectsList.vue -->
<template>
  <div class="projects-bg" @click="deselectRow">
    <div class="projects-content">
      <h2>Projects</h2>
      <div class="action-icons">
        <SearchByString
          v-model="searchTerm"
          placeholder="Search projects..."
          @input="onSearchInput"
        />
        <button :disabled="selectedRow === null" @click.stop="openEditModal">
          <img src="@/assets/icons/pencil.png" alt="Edit" class="icon" />
        </button>
        <button :disabled="selectedRow === null" @click.stop="deleteSelectedRow">
          <img src="@/assets/icons/recycle-bin.png" alt="Delete" class="icon" />
        </button>
        <button @click.stop="addNewProject">
          <img src="@/assets/icons/add.png" alt="Add" class="icon" />
        </button>
      </div>
      <div class="table-container">
        <table class="projects-table" @click.stop>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Description</th>
            <th>Address</th>
            <th>Created</th>
            <th>Last Update</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(project, rowIdx) in projects"
            :key="project.idProject"
            :class="{ 'row-selected': selectedRow === rowIdx }"
          >
            <td
              class="company"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'company' }"
              @click="selectCell(rowIdx, 'company')"
            >
              <AutocompleteCombo
                v-if="selectedRow === rowIdx && selectedCell === 'company'"
                v-model="project.companyObj"
                table="Companies"
                :searchColumns="['description']"
                :displayColumns="['description']"
                idField="idCompany"
                labelField="description"
                placeholder="Type company name..."
                @select="onCompanySelect(project, $event)"
              />
              <span v-else>{{ getCompanyName(project) }}</span>
            </td>
            <td
              class="description"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'description' }"
              @click="selectCell(rowIdx, 'description')"
            >
              <input v-model="project.description" @change="saveProject(project)" type="text" class="table-input" />
            </td>
            <td
              class="address"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'address' }"
              @click="selectCell(rowIdx, 'address')"
            >
              <input v-model="project.address" @change="saveProject(project)" type="text" class="table-input" />
            </td>
            <td
              class="created"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'created' }"
              @click="selectCell(rowIdx, 'created')"
            >
              <input :value="formatDateForInput(project.created)" 
                     @input="project.created = $event.target.value"
                     @change="saveProject(project)" type="date" class="table-input" />
            </td>
            <td
              class="last-update"
              :class="{ 'cell-selected': selectedRow === rowIdx && selectedCell === 'last-update' }"
              @click="selectCell(rowIdx, 'last-update')"
            >
              <input :value="formatDateForInput(project.lastUpdate)" 
                     @input="project.lastUpdate = $event.target.value"
                     @change="saveProject(project)" type="date" class="table-input" />
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      <!-- Edit Modal Placeholder -->
      <div v-if="showEditModal" class="modal-overlay" @click.stop>
        <div class="modal-content">
          <button class="modal-close" @click="showEditModal = false">X</button>
          <h3>Edit Project</h3>
          <div>
            <!-- Placeholder for future form -->
            <pre>{{ selectedProject }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import AutocompleteCombo from '@/components/AutocompleteCombo.vue';
import SearchByString from '@/components/SearchByString.vue';
import Project from '../../../types/Project';

export default {
  components: {
    AutocompleteCombo,
    SearchByString
  },
  data() {
    return {
      projects: [],
      selectedRow: null,
      selectedCell: null,
      showEditModal: false,
      selectedProject: null,
      searchTerm: '',
    };
  },
  created() {
    this.loadProjects();
  },
  methods: {
    loadProjects() {
      axios.get(`${API_BASE_URL}/projects/getBySubstring?searchFor=${this.searchTerm}`).then(res => {
        this.projects = res.data;
        // Optionally fetch company details for each project
        this.enrichProjectsWithCompanyData();
      });
    },
    onSearchInput(value) {
      this.searchTerm = value || '';
      this.loadProjects();
    },
    formatDateForInput(dateStr) {
      if (!dateStr) return '';
      return dateStr.slice(0, 10);
    },
    async saveProject(project) {
      try {
        await axios.put(`${API_BASE_URL}/projects/${project.idProject}`, project);
      } catch (e) {
        alert('Error saving project');
      }
    },
    selectCell(rowIdx, cellName) {
      this.selectedRow = rowIdx;
      this.selectedCell = cellName;
      this.selectedProject = this.projects[rowIdx];
    },
    openEditModal() {
      if (this.selectedRow !== null) {
        this.selectedProject = this.projects[this.selectedRow];
        this.showEditModal = true;
      }
    },
    deleteSelectedRow() {
      if (this.selectedRow !== null) {
        const project = this.projects[this.selectedRow];
        if (confirm(`Delete project ${project.description}?`)) {
          axios.delete(`${API_BASE_URL}/projects/${project.idProject}`).then(() => {
            this.projects.splice(this.selectedRow, 1);
            this.selectedRow = null;
            this.selectedCell = null;
            this.selectedProject = null;
          });
        }
      }
    },

    addNewProject() {
      // Create a new empty project object (adjust fields as needed)
      const newProject = new Project();
      this.projects.push(newProject);
      this.selectedRow = this.projects.length - 1;
      this.selectedCell = 'company';
      this.selectedProject = newProject;
      // Optionally, open the edit modal immediately
      // this.showEditModal = true;
    },

    deselectRow() {
      console.log('Deselecting row');
      this.selectedRow = null;
      this.selectedCell = null;
      this.selectedProject = null;
    },
    onCompanySelect(project, companyObj) {
      project.company = companyObj.idCompany;
      project.companyObj = companyObj;
      this.saveProject(project);
    },
    getCompanyName(project) {
      if (project.companyObj && project.companyObj.companyName) {
        return project.companyObj.companyName;
      }
      return project.company || '';
    },
    async enrichProjectsWithCompanyData() {
      // Fetch company details for projects that have a company ID
      const companyIds = [...new Set(this.projects.map(p => p.company).filter(Boolean))];
      
      for (const companyId of companyIds) {
        try {
          const res = await axios.get(`${API_BASE_URL}/companies/${companyId}`);
          // Attach company object to all projects with this company ID
          this.projects.forEach(project => {
            if (project.company === companyId) {
              this.$set(project, 'companyObj', res.data);
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
.projects-bg {
  min-height: 100vh;
  width: 100vw;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.projects-content {
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
.projects-table {
  width: 100%;
  border-collapse: collapse;
}
.projects-table th, .projects-table td {
  border: 1px solid #888;
  padding: 6px 8px;
  text-align: left;
}
.projects-table th {
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
.projects-table td.company{
  width: 200px;
  max-width: 200px;
  position: relative;
  padding: 6px 8px;
}
.projects-table td.company span {
  display: block;
}
.projects-table td.created,
.projects-table td.last-update {
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