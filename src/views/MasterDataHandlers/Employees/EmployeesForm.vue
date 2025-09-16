<template>
  <div>
    <h2>{{ isEdit ? 'Edit' : 'Add' }} Employee</h2>
    <form @submit.prevent="saveEmployee">
      <input v-model.number="employee.idEmployee" placeholder="Employee ID" required :readonly="isEdit" />
      <input v-model.number="employee.idBranch" placeholder="Branch ID" required />
      <input v-model="employee.familyName" placeholder="Family Name" />
      <input v-model="employee.firstName" placeholder="First Name" />
      <input v-model="employee.email" placeholder="Email" />
      <input v-model="employee.mobile" placeholder="Mobile" />
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
      employee: {
        idEmployee: '',
        idBranch: '',
        familyName: '',
        firstName: '',
        email: '',
        mobile: ''
      }
    };
  },
  computed: {
    isEdit() { return !!this.id; }
  },
  created() {
    if (this.isEdit) {
      axios.get(`${API_BASE_URL}/employees/${this.id}`).then(res => {
        this.employee = res.data;
      });
    }
  },
  methods: {
    saveEmployee() {
      if (this.isEdit) {
        axios.put(`${API_BASE_URL}/employees/${this.id}`, this.employee).then(() => {
          this.$router.push('/employees');
        });
      } else {
        axios.post(`${API_BASE_URL}/employees`, this.employee).then(() => {
          this.$router.push('/employees');
        });
      }
    }
  }
}
</script>