<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEditing ? 'Modifica' : 'Nuovo' }} Evento</h3>
      <input v-model="localEvent.description" placeholder="Descrizione" />
      <SearchComboBox v-model="localEvent.company" />
      <SearchComboBox v-model="localEvent.category" />
      <!-- ...other fields... -->
      <button @click="save">Salva</button>
      <button @click="$emit('close')">Annulla</button>
    </div>
  </div>
</template>
<script>

import SearchComboBox from '@/components/SearchComboBox.vue';
export default {
  props: { event: Object, isEditing: Boolean },
  components: { SearchComboBox },
  data() {
    return { localEvent: { ...this.event } };
  },
  methods: {
    save() { this.$emit('save', this.localEvent); }
  }
};
</script>