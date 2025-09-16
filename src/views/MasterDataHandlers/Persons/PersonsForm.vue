<template>
  <div>
    <h2>{{ isEdit ? 'Edit' : 'Add' }} Person</h2>
    <form @submit.prevent="savePerson">
      <input v-model.number="person.idCustomer" placeholder="Customer ID" required />
      <input v-model="person.familyName" placeholder="Family Name" />
      <input v-model="person.firstName" placeholder="First Name" />
      <input v-model="person.role" placeholder="Role" />
      <input v-model="person.mobile" placeholder="Mobile" />
      <input v-model="person.office" placeholder="Office" />
      <input v-model="person.email" placeholder="Email" />
      <input v-model="person.street" placeholder="Street" />
      <input v-model="person.zip" placeholder="ZIP" />
      <input v-model="person.city" placeholder="City" />
      <input v-model="person.region" placeholder="Region" />
      <input v-model="person.country" placeholder="Country" />
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
      person: {
        idPerson: 0,
        idCustomer: '',
        familyName: '',
        firstName: '',
        role: '',
        mobile: '',
        office: '',
        email: '',
        street: '',
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
      axios.get(`${API_BASE_URL}/persons/${this.id}`).then(res => {
        this.person = res.data;
      });
    }
  },
  methods: {
    savePerson() {
      if (this.isEdit) {
        axios.put(`${API_BASE_URL}/persons/${this.id}`, this.person).then(() => {
          this.$router.push('/persons');
        });
      } else {
        axios.post(`${API_BASE_URL}/persons`, this.person).then(() => {
          this.$router.push('/persons');
        });
      }
    }
  }
}
</script>