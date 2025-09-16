<template>
  <div>
    <h2>{{ isEdit ? 'Edit' : 'Add' }} Organization</h2>
    <form @submit.prevent="saveOrganization">
      <input v-model.number="organization.idOrganization" placeholder="Organization ID" required :readonly="isEdit" />
      <input v-model="organization.name1" placeholder="Name 1" />
      <input v-model="organization.name2" placeholder="Name 2" />
      <input v-model="organization.email" placeholder="Email" />
      <input v-model="organization.street1" placeholder="Street 1" />
      <input v-model="organization.street2" placeholder="Street 2" />
      <input v-model="organization.zip" placeholder="ZIP" />
      <input v-model="organization.city" placeholder="City" />
      <input v-model="organization.region" placeholder="Region" />
      <input v-model="organization.country" placeholder="Country" />
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
      organization: {
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
      axios.get(`${API_BASE_URL}/organization/${this.id}`).then(res => {
        this.organization = res.data;
      });
    }
  },
  methods: {
    saveOrganization() {
      if (this.isEdit) {
        axios.put(`${API_BASE_URL}/organization/${this.id}`, this.organization).then(() => {
          this.$router.push('/organization');
        });
      } else {
        axios.post(`${API_BASE_URL}/organization`, this.organization).then(() => {
          this.$router.push('/organization');
        });
      }
    }
  }
}
</script>