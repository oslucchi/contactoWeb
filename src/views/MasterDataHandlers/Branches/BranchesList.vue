<template>
  <div>
    <h2>Branches</h2>
    <router-link to="/branches/new">Add Branch</router-link>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Organization ID</th>
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
        <tr v-for="branch in branches" :key="branch.idBranch">
          <td>{{ branch.idBranch }}</td>
          <td>{{ branch.idOrganization }}</td>
          <td>{{ branch.name1 }}</td>
          <td>{{ branch.name2 }}</td>
          <td>{{ branch.email }}</td>
          <td>{{ branch.street1 }}</td>
          <td>{{ branch.street2 }}</td>
          <td>{{ branch.zip }}</td>
          <td>{{ branch.city }}</td>
          <td>{{ branch.region }}</td>
          <td>{{ branch.country }}</td>
          <td>
            <router-link :to="`/branches/${branch.idBranch}`">Edit</router-link>
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
    return { branches: [] };
  },
  created() {
    axios.get(`${API_BASE_URL}/branches`).then(res => {
      this.branches = res.data;
    });
  }
}
</script>