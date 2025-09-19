<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3>Annulla Evento</h3>
      <p>Motivo annullamento:</p>
      <input v-model="reason" placeholder="Motivo" />
      <button @click="confirm">Conferma</button>
      <button @click="$emit('close')">Annulla</button>
    </div>
  </div>
</template>
<script>
export default {
  props: { event: Object },
  data() { return { reason: '' }; },
  methods: {
    confirm() { this.$emit('confirm', { event: this.event, reason: this.reason }); }
  }
};
</script>