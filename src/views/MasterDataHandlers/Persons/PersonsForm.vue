<template>
  <div>
    <h2>{{ isEdit ? $t('navigation.editPerson') : $t('navigation.newPerson') }}</h2>
    <form @submit.prevent="savePerson">
      <input v-model.number="person.idCustomer" :placeholder="$t('forms.placeholders.customerId')" required />
      <input v-model="person.familyName" :placeholder="$t('forms.placeholders.familyName')" />
      <input v-model="person.firstName" :placeholder="$t('forms.placeholders.firstName')" />
      <input v-model="person.role" :placeholder="$t('forms.placeholders.role')" />
      <input v-model="person.mobile" :placeholder="$t('forms.placeholders.mobile')" />
      <input v-model="person.office" :placeholder="$t('forms.placeholders.office')" />
      <input v-model="person.email" :placeholder="$t('forms.placeholders.email')" />
      <input v-model="person.street" :placeholder="$t('forms.placeholders.street')" />
      <input v-model="person.zip" :placeholder="$t('forms.placeholders.zip')" />
      <input v-model="person.city" :placeholder="$t('forms.placeholders.city')" />
      <input v-model="person.region" :placeholder="$t('forms.placeholders.region')" />
      <input v-model="person.country" :placeholder="$t('forms.placeholders.country')" />
      <button type="submit">{{ $t('common.save') }}</button>
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