<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/Agenda/EventDetailsModal.vue -->
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <button class="modal-close" @click="closeEventModal">X</button>
      <div v-if="event">
        <div class="event-header">
          <div class="event-desc-icon">
            <span
              v-if="event.cancelled"
              class="event-description cancelled"
            >
              {{ event.description }}
            </span>
            <span v-else class="event-description">
              {{ event.description }}
            </span>
            <img
              v-if="event.iconName"
              :src="getIconPath(event.iconName)"
              :alt="event.iconName"
              class="event-icon"
            />
          </div>
          <div v-if="event.cancelled" class="cancel-reason">
            (Annullato: {{ event.cancelReason }})
          </div>
        </div>
        <div class="event-row">
          <span><strong>Data:</strong> {{ formatDate(event.date) }}</span>
          <span><strong>Durata:</strong> {{ event.duration }} min</span>
        </div>
        <div class="event-row">
          <span><strong>Azienda:</strong> {{ event.company }}</span>
        </div>
        <div class="event-row">
          <span><strong>Categoria:</strong> {{ event.category }}</span>
        </div>
        <div class="participants-section">
          <div class="participants-list">
            <span class="participants-label">Partecipanti:</span>
            <span v-if="participants.length === 0" class="participants-empty">Nessuno</span>
            <span v-else>
              <span
                v-for="(p, idx) in participants"
                :key="p.idPerson"
                class="participant"
              >
                {{ p.familyName }} {{ p.firstName }}<span v-if="p.company"> ({{ p.company }})</span><span v-if="idx < participants.length - 1">, </span>
              </span>
            </span>
            <button class="participants-edit-btn" @click="showParticipantsEdit = true">Modifica</button>
          </div>
          <SearchComboBox
            v-if="showParticipantsEdit"
            modal
            label="Gestione partecipanti"
            :table="'Persons'"
            :searchColumns="['familyName','firstName','company']"
            :displayColumns="['familyName','firstName','company']"
            :currentItems="participants"
            :addApi="addApi"
            :deleteApi="deleteApi"
            @update:currentItems="participants = $event"
            @close="showParticipantsEdit = false"
          />
        </div>
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
import SearchComboBox from '@/components/SearchComboBox.vue';

export default {
  components: { SearchComboBox },
  props: {
    event: Object,
    reports: Array,
    loading: Boolean
  },
  computed: {
    addApi() {
      if (!this.event || !this.event.idEvent) return '';
      return `${process.env.VUE_APP_API_BASE_URL || API_BASE_URL}/events/manageParticipant2?action=add&idEvent=${this.event.idEvent}&idPerson=`;
    },
    deleteApi() {
      if (!this.event || !this.event.idEvent) return '';
      return `${process.env.VUE_APP_API_BASE_URL || API_BASE_URL}/events/manageParticipant2?action=del&idEvent=${this.event.idEvent}&idPerson=`;
    }
  },
  data() {
    return {
      participants: this.event && this.event.participants ? this.event.participants : [],
      showParticipantsEdit: false,
    };
  },
  watch: {
    event: {
      handler(newVal) {
        this.participants = newVal && newVal.participants ? newVal.participants : [];
      },
      immediate: true
    }
  },
  methods: {
    formatDateTime(date) {
      if (!date) return '';
      return dayjs(date).format('YY/MM/DD HH:mm');
    },
    formatDate(date) {
      if (!date) return '';
      return dayjs(date).format('YYYY-MM-DD');
    },
    getIconPath(iconName) {
      try {
        return require(`@/assets/icons/${iconName}.png`);
      } catch (e) {
        return '';
      }
    },
    onParticipantSelected(person) {
      // Add or remove logic here
      if (!this.participants.find(p => p.idPerson === person.idPerson)) {
        this.participants.push(person);
      }
      this.showParticipantsEdit = false;
      // Optionally emit an event or call an API to update participants
    },
    closeEventModal() {
      this.showParticipantsEdit = false; // Reset when closing
      this.$emit('close');
    },
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
.event-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
}
.event-desc-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.event-description {
  font-size: 1.3em;
  font-weight: 500;
  text-align: center;
}
.event-description.cancelled {
  color: red;
  text-decoration: line-through;
}
.event-icon {
  width: 32px;
  height: 32px;
}
.cancel-reason {
  color: red;
  font-size: 0.95em;
  margin-top: 4px;
}
.event-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
  font-size: 1em;
}
.right-align {
  justify-content: flex-end;
  text-align: right;
}
.participants-section {
  margin: 8px 0 0 0;
  font-size: 0.92em;
}
.participants-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.participants-label {
  font-weight: 500;
  margin-right: 4px;
}
.participants-empty {
  color: #888;
}
.participant {
  font-size: 0.95em;
}
.participants-edit-btn {
  margin-left: 12px;
  font-size: 0.9em;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #1976d2;
  background: #f5faff;
  color: #1976d2;
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