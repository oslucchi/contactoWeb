<template>
  <div>
    <h2>{{ isEdit ? 'Edit' : 'Add' }} Company</h2>
    <form @submit.prevent="saveCompany">
      <input v-model.number="company.idCompany" placeholder="Company ID" required :readonly="isEdit" />
      <input v-model.number="company.idSegment" placeholder="Segment ID" required />
      <input v-model="company.description" placeholder="Description" />
      <input v-model.number="company.status" placeholder="Status" />
      <input v-model="company.type" placeholder="Type" />
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
      company: {
        idCompany: '',
        idSegment: '',
        description: '',
        status: '',
        type: ''
      }
    };
  },
  computed: {
    isEdit() { return !!this.id; }
  },
  created() {
    if (this.isEdit) {
      axios.get(`${API_BASE_URL}/companies/${this.id}`).then(res => {
        this.company = res.data;
      });
    }
  },
  methods: {
    saveCompany() {
      if (this.isEdit) {
        axios.put(`${API_BASE_URL}/companies/${this.id}`, this.company).then(() => {
          this.$router.push('/companies');
        });
      } else {
        axios.post(`${API_BASE_URL}/companies`, this.company).then(() => {
          this.$router.push('/companies');
        });
      }
    }
  }
}
</script>