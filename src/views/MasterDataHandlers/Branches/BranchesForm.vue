<template>
  <div>
    <h2>{{ isEdit ? 'Edit' : 'Add' }} Branch</h2>
    <form @submit.prevent="saveBranch">
      <input v-model.number="branch.idBranch" placeholder="Branch ID" required :readonly="isEdit" />
      <input v-model.number="branch.idOrganization" placeholder="Organization ID" required />
      <input v-model="branch.name1" placeholder="Name 1" />
      <input v-model="branch.name2" placeholder="Name 2" />
      <input v-model="branch.email" placeholder="Email" />
      <input v-model="branch.street1" placeholder="Street 1" />
      <input v-model="branch.street2" placeholder="Street 2" />
      <input v-model="branch.zip" placeholder="ZIP" />
      <input v-model="branch.city" placeholder="City" />
      <input v-model="branch.region" placeholder="Region" />
      <input v-model="branch.country" placeholder="Country" />
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
      branch: {
        idBranch: '',
        idOrganization: '',
        name1: '',
        name2: '',
        email: '',
        street1: '',
        street2: '',
        zip: '',
        city: '',
        region: '',
        country: ''
      }
    };
  },
  computed: {
    isEdit() { return !!this.id; }
  },
  created() {
    if (this.isEdit) {
      axios.get(`${API_BASE_URL}/branches/${this.id}`).then(res => {
        this.branch = res.data;
      });
    }
  },
  methods: {
    saveBranch() {
      if (this.isEdit) {
        axios.put(`${API_BASE_URL}/branches/${this.id}`, this.branch).then(() => {
          this.$router.push('/branches');
        });
      } else {
        axios.post(`${API_BASE_URL}/branches`, this.branch).then(() => {
          this.$router.push('/branches');
        });
      }
    }
  }
}
</script>