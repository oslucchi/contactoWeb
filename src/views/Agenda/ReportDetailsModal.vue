<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/Agenda/ReportDetailsModal.vue -->
<template>
  <div class="report-modal-overlay" style="background:rgba(0,0,0,0.7);">
    <div class="modal-content report-modal-content">
      <button class="modal-close" @click="$emit('close')">X</button>
      <h3>{{ isAdding ? 'Aggiungi' : 'Modifica' }} Report</h3>
      <input v-model="localReport.summary" placeholder="Sommario" style="width:100%; margin-bottom: 8px; font-size: 1.1em;" />
      <textarea v-model="localReport.report" placeholder="Testo" rows="8" style="width:100%"></textarea>
      <div style="margin-top:12px;">
        <button @click="save" class="save-btn">Salva</button>
        <button @click="$emit('close')" class="cancel-btn">Annulla</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    report: Object,
    isAdding: Boolean
  },
  data() {
    return {
      localReport: { ...this.report }
    };
  },
  watch: {
    report(newVal) {
      this.localReport = { ...newVal };
    }
  },
  methods: {
    save() {
      this.$emit('save', this.localReport);
    }
  }
};
</script>

<style>
body .report-modal-overlay {
  background: rgba(0,0,0,0.7) !important;
}
.report-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(80,80,80,0.1) !important; /* Force override */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.report-modal-content {
  background: #fff !important;
  width: 90vw;
  max-width: 600px;
  min-width: 320px;
  min-height: 300px;
  max-height: 90vh;
  text-align: left;
  font-size: 1.1em;
  padding: 24px;
  box-sizing: border-box;
  overflow-y: auto;
}

.report-modal-content input,
.report-modal-content textarea {
  width: 100%;
  box-sizing: border-box;
  font-size: 1em;
}

.report-modal-content textarea {
  min-height: 100px;
  max-height: 300px;
  resize: vertical;
}

.save-btn {
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  margin-right: 8px;
  cursor: pointer;
}
.cancel-btn {
  background: #eee;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  cursor: pointer;
}
</style>