<template>
  <div>
    <h2>{{ isEdit ? $t('navigation.editCompany') : $t('navigation.newCompany') }}</h2>
    <form @submit.prevent="saveCompany">
      <input v-model.number="company.idCompany" :placeholder="$t('forms.placeholders.companyId')" required :readonly="isEdit" />
      <input v-model.number="company.idSegment" :placeholder="$t('forms.placeholders.segmentId')" required />
      <input v-model="company.description" :placeholder="$t('forms.placeholders.description')" />
      <input v-model.number="company.status" :placeholder="$t('forms.placeholders.status')" />
      <input v-model="company.type" :placeholder="$t('forms.placeholders.type')" />
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
      company: {
        idCompany: '',
        idSegment: '',
        description: '',
        status: '',
        type: ''
      }
    };
  },
  computed: {
    isEdit() { return !!this.id; }
  },
  created() {
    if (this.isEdit) {
      axios.get(`${API_BASE_URL}/companies/${this.id}`).then(res => {
        this.company = res.data;
      });
    }
  },
  methods: {
    saveCompany() {
      if (this.isEdit) {
        axios.put(`${API_BASE_URL}/companies/${this.id}`, this.company).then(() => {
          this.$router.push('/companies');
        });
      } else {
        axios.post(`${API_BASE_URL}/companies`, this.company).then(() => {
          this.$router.push('/companies');
        });
      }
    }
  }
}
</script>