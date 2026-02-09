<template>
  <div class="organization-bg">
    <div class="organization-content">
      <h2>Organizations</h2>
      <div class="action-bar">
        <SearchByString
          v-model="searchTerm"
          placeholder="Search organizations..."
          @input="onSearchInput"
        />
        <router-link to="/organization/new">Add Organization</router-link>
      </div>
      <div class="table-container">
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
    </div>
  </div>
</template>
<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import SearchByString from '@/components/SearchByString.vue';

export default {
  components: {
    SearchByString
  },
  data() {
    return { 
      organizations: [],
      searchTerm: ''
    };
  },
  created() {
    this.loadOrganizations();
  },
  methods: {
    loadOrganizations() {
      const endpoint = this.searchTerm ?
        `${API_BASE_URL}/organization/search?searchFor=${this.searchTerm}` :
        `${API_BASE_URL}/organization`;
      axios.get(endpoint).then(res => {
        this.organizations = res.data;
      });
    },
    onSearchInput(value) {
      this.searchTerm = value || '';
      this.loadOrganizations();
    }
  }
}
</script>
<style scoped>
.organization-bg {
  min-height: 100vh;
  width: 100vw;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.organization-content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  overflow: hidden;
}
.action-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.action-bar a {
  padding: 6px 12px;
  background: #72ad45;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  white-space: nowrap;
}
.action-bar a:hover {
  background: #5d8f37;
}
.table-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #ddd;
  margin-top: 16px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #888;
  padding: 6px 8px;
  text-align: left;
}
th {
  background: #f0f0f0;
}
</style>