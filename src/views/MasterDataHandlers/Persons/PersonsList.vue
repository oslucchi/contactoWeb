<template>
  <div>
    <h2>Persons</h2>
    <router-link to="/persons/new">Add Person</router-link>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Customer ID</th>
          <th>Family Name</th>
          <th>First Name</th>
          <th>Role</th>
          <th>Mobile</th>
          <th>Office</th>
          <th>Email</th>
          <th>Street</th>
          <th>ZIP</th>
          <th>City</th>
          <th>Region</th>
          <th>Country</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="person in persons" :key="person.idPerson">
          <td>{{ person.idPerson }}</td>
          <td>{{ person.idCustomer }}</td>
          <td>{{ person.familyName }}</td>
          <td>{{ person.firstName }}</td>
          <td>{{ person.role }}</td>
          <td>{{ person.mobile }}</td>
          <td>{{ person.office }}</td>
          <td>{{ person.email }}</td>
          <td>{{ person.street }}</td>
          <td>{{ person.zip }}</td>
          <td>{{ person.city }}</td>
          <td>{{ person.region }}</td>
          <td>{{ person.country }}</td>
          <td>
            <router-link :to="`/persons/${person.idPerson}`">Edit</router-link>
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
    return { persons: [] };
  },
  created() {
    console.log('API_BASE_URL:', API_BASE_URL + '/persons');

    axios.get(`${API_BASE_URL}/persons`).then(res => {
      this.persons = res.data;
    });
  }
}
</script>