<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3>{{ $t('events.cancel') }}</h3>
      <p>{{ $t('events.cancelReason') }}</p>
      <input v-model="reason" :placeholder="$t('forms.placeholders.reason')" />
      <button @click="confirm">{{ $t('common.confirm') }}</button>
      <button @click="$emit('close')">{{ $t('common.cancel') }}</button>
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