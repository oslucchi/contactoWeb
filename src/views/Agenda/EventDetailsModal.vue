<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/Agenda/EventDetailsModal.vue -->
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <button class="modal-close" @click="$emit('close')">X</button>
      <div v-if="event">
        <h3>
          <span v-if="event.cancelled" style="color: red; text-decoration: line-through;">
            {{ event.description }}
          </span>
          <span v-else>
            {{ event.description }}
          </span>
        </h3>
        <div v-if="event.cancelled" style="color: red; font-size: 0.95em;">
          (Annullato: {{ event.cancelReason }})
        </div>
        <p><strong>Data:</strong> {{ formatDateTime(event.date) }}</p>
        <p><strong>Durata:</strong> {{ event.duration }} min</p>
        <p><strong>Azienda:</strong> {{ event.company }}</p>
        <p><strong>Categoria:</strong> {{ event.category }}</p>
        <!-- Example usage of SearchComboBox for company/category (uncomment if needed) -->
        <!--
        <SearchComboBox
          label="Azienda"
          :table="'companies'"
          :searchColumns="['name']"
          :displayColumns="['name']"
          v-model="selectedCompany"
        />
        <SearchComboBox
          label="Categoria"
          :table="'categories'"
          :searchColumns="['name']"
          :displayColumns="['name']"
          v-model="selectedCategory"
        />
        -->
        <div style="margin-top: 16px;">
          <button @click="$emit('edit-event', event)">Modifica</button>
          <button @click="$emit('cancel-event', event)" v-if="!event.cancelled">Annulla</button>
        </div>
        <h4 class="reports-header" style="margin-top: 24px;">
          <span>Report disponibili</span>
          <button class="add-report-btn" @click="$emit('add-report')" title="Aggiungi report">
            <img src="@/assets/icons/add.png" alt="Add" class="add-icon" />
          </button>
        </h4>
        <div v-if="loading">Caricamento report...</div>
        <ul v-else class="reports-list">
          <li v-if="!reports || reports.length === 0">Nessun report disponibile.</li>
          <li v-for="report in reports" :key="report.idReport"
              @click="$emit('edit-report', report)"
              style="cursor:pointer; text-decoration:underline;">
            {{ formatDateTime(report.date) }} - {{ report.summary }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs';
// import SearchComboBox from './SearchComboBox.vue'; // Uncomment if using

export default {
  // components: { SearchComboBox }, // Uncomment if using
  props: {
    event: Object,
    reports: Array,
    loading: Boolean
  },
  data() {
    return {
      // selectedCompany: null, // Example for SearchComboBox
      // selectedCategory: null
    };
  },
  methods: {
    formatDateTime(date) {
      if (!date) return '';
      return dayjs(date).format('YY/MM/DD HH:mm');
    }
  }
};
</script>

<style>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  min-width: 400px;
  max-width: 600px;
  min-height: 300px;
  max-height: 90vh;
  padding: 32px 24px 24px 24px;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  overflow-y: auto;
  position: relative;
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: transparent;
  border: none;
  font-size: 1.3em;
  cursor: pointer;
}
.reports-header {
  display: flex;
  align-items: left;
  gap: 8px;
  margin: 0;
  padding: 0;
}
.add-icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}
.add-report-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.reports-list {
  text-align: left;
  padding-left: 0;
  margin-left: 0;
  list-style-position: inside;
}
</style>