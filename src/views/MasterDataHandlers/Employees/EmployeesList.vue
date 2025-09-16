<template>
  <div>
    <h2>Employees</h2>
    <router-link to="/employees/new">Add Employee</router-link>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Branch ID</th>
          <th>Family Name</th>
          <th>First Name</th>
          <th>Email</th>
          <th>Mobile</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="employee in employees" :key="employee.idEmployee">
          <td>{{ employee.idEmployee }}</td>
          <td>{{ employee.idBranch }}</td>
          <td>{{ employee.familyName }}</td>
          <td>{{ employee.firstName }}</td>
          <td>{{ employee.email }}</td>
          <td>{{ employee.mobile }}</td>
          <td>
            <router-link :to="`/employees/${employee.idEmployee}`">Edit</router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';

export default {
  data() {
    return { employees: [] };
  },
  created() {
    axios.get(`${API_BASE_URL}/employees`).then(res => {
      this.employees = res.data;
    });
  }
}
</script>