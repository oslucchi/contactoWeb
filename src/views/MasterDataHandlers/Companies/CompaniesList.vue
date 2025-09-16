<template>
  <div>
    <h2>Companies</h2>
    <router-link to="/companies/new">Add Company</router-link>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Segment ID</th>
          <th>Description</th>
          <th>Status</th>
          <th>Type</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="company in companies" :key="company.idCompany">
          <td>{{ company.idCompany }}</td>
          <td>{{ company.idSegment }}</td>
          <td>{{ company.description }}</td>
          <td>{{ company.status }}</td>
          <td>{{ company.type }}</td>
          <td>
            <router-link :to="`/companies/${company.idCompany}`">Edit</router-link>
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
    return { companies: [] };
  },
  created() {
    axios.get(`${API_BASE_URL}/companies`).then(res => {
      this.companies = res.data;
    });
  }
}
</script>