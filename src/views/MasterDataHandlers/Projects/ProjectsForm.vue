<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/MasterDataHandlers/Project/ProjectsForm.vue -->
<template>
  <div>
    <h2>{{ isEdit ? 'Edit' : 'Add' }} Project</h2>
    <form @submit.prevent="saveProject">
      <input v-model.number="project.idProject" placeholder="Project ID" required :readonly="isEdit" />
      <input v-model.number="project.company" placeholder="Company" required />
      <input v-model.number="project.idDesigner" placeholder="Designer ID" />
      <input v-model="project.description" placeholder="Description" maxlength="45" />
      <input v-model="project.address" placeholder="Address" maxlength="120" />
      <input v-model="project.created" placeholder="Created" type="date" />
      <input v-model="project.lastUpdate" placeholder="Last Update" type="date" />
      <button type="submit">Save</button>
    </form>
  </div>
</template>
<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';

export default {
  props: ['id'],
  data() {
    return {
      project: {
        idProject: '',
        idCustomer: '',
        idDesigner: '',
        description: '',
        address: '',
        created: '',
        lastUpdate: ''
      }
    };
  },
  computed: {
    isEdit() { return !!this.id; }
  },
  created() {
    if (this.isEdit) {
      axios.get(`${API_BASE_URL}/projects/getById?id=${this.id}`).then(res => {
        this.project = res.data;
      });
    }
  },
  methods: {
    saveProject() {
      if (this.isEdit) {
        axios.put(`${API_BASE_URL}/projects/getById?id=${this.id}`, this.project).then(() => {
          this.$router.push('/projects');
        });
      } else {
        axios.post(`${API_BASE_URL}/projects`, this.project).then(() => {
          this.$router.push('/projects');
        });
      }
    }
  }
}
</script>