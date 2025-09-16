<template>
  <div>
    <h2>Organizations</h2>
    <router-link to="/organization/new">Add Organization</router-link>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name 1</th>
          <th>Name 2</th>
          <th>Email</th>
          <th>Street 1</th>
          <th>Street 2</th>
          <th>ZIP</th>
          <th>City</th>
          <th>Region</th>
          <th>Country</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="organization in organizations" :key="organization.idOrganization">
          <td>{{ organization.idOrganization }}</td>
          <td>{{ organization.name1 }}</td>
          <td>{{ organization.name2 }}</td>
          <td>{{ organization.email }}</td>
          <td>{{ organization.street1 }}</td>
          <td>{{ organization.street2 }}</td>
          <td>{{ organization.zip }}</td>
          <td>{{ organization.city }}</td>
          <td>{{ organization.region }}</td>
          <td>{{ organization.country }}</td>
          <td>
            <router-link :to="`/organization/${organization.idOrganization}`">Edit</router-link>
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
    return { organizations: [] };
  },
  created() {
    axios.get(`${API_BASE_URL}/organization`).then(res => {
      this.organizations = res.data;
    });
  }
}
</script>