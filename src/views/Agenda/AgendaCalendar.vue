<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/Agenda/AgendaCalendar.vue -->
<template>
  <div>
    <h2>Agenda</h2>
    <div class="calendar">
      <div class="calendar-header">
        <button @click="prevMonth">&lt;</button>
        <span>{{ monthYear }}</span>
        <button @click="nextMonth">&gt;</button>
      </div>
      <div class="calendar-grid">
        <!-- Days of week header -->
        <div class="calendar-day" v-for="day in daysOfWeek" :key="day">{{ day }}</div>
        <!-- Calendar cells -->
        <div v-for="cell in calendarCells" :key="cell.date + '-' + cell.day" class="calendar-cell">
          <div class="cell-date">{{ cell.day }}</div>
          <div
            v-for="event in cell.events"
            :key="event.idEvent"
            class="agenda-event"
            :class="{ cancelled: event.cancelled }"
            @click="openEventDetails(event)"
            style="cursor:pointer"
          >
            <div class="event-info">
              <span v-if="event.cancelled" class="cancelled-text">
                {{ event.description }} (Annullato: {{ event.cancelReason }})
              </span>
              <span v-else>
                {{ event.description }}
              </span>
              <span class="event-date">
                {{ formatDateTime(event.date) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button @click="openAddEventModal">Aggiungi Evento</button>

    <!-- Modals -->
    <EventDetailsModal
      v-if="modalMode === 'event'"
      :event="selectedEvent"
      :reports="reports"
      :loading="loadingReports"
      @close="closeEventModal"
      @edit-event="openEditEventModal"
      @cancel-event="openCancelEventModal"
      @edit-report="openEditReportModal"
    />
    <EventEditModal
      v-if="modalMode === 'edit'"
      :event="editedEvent"
      :is-editing="!!editedEvent.idEvent"
      @close="closeEditEventModal"
      @save="saveEvent"
    />
    <CancelEventModal
      v-if="modalMode === 'cancel'"
      :event="editedEvent"
      @close="closeCancelEventModal"
      @confirm="cancelEvent"
    />
    <ReportDetailsModal
      v-if="showReportModal"
      :report="selectedReport"
      @close="closeReportModal"
    />
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import EventDetailsModal from './EventDetailsModal.vue';
import EventEditModal from './EventEditModal.vue';
import ReportDetailsModal from './ReportDetailsModal.vue';
import EventCancelModal from './EventCancelModal.vue';
import dayjs from 'dayjs';

export default {
  components: { EventDetailsModal, EventEditModal, EventCancelModal, ReportDetailsModal },
  data() {
    return {
      events: [],
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      modalMode: null,
      editedEvent: null,
      selectedEvent: null,
      reports: [],
      loadingReports: false,
      selectedReport: null,
      showReportModal: false,
    };
  },
  computed: {
    monthYear() {
      return new Date(this.currentYear, this.currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    },
    calendarCells() {
      const firstDay = new Date(this.currentYear, this.currentMonth, 1);
      const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
      const cells = [];
      let dayOfWeek = firstDay.getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        cells.push({ date: '', day: '', events: [] });
      }
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const cellDate = new Date(this.currentYear, this.currentMonth, d);
        const cellDateStr = dayjs(cellDate).format('YYYY-MM-DD');
        const events = this.events.filter(ev => {
          if (!ev.date) return false;
          // ev.date might be a string or Date
          const eventDateStr = dayjs(ev.date).format('YYYY-MM-DD');
          if (eventDateStr === cellDateStr) {
            console.log(`found an event date ${eventDateStr} coherent with the cell date ${cellDateStr}`);
            return true;
          }
          return false;
        });
        cells.push({ date: cellDateStr, day: d, events });
      }
      return cells;
    }
  },
  mounted() {
    this.fetchEvents();
  },
  methods: {
    async fetchEvents() {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/agenda/schedule`, 
          {
            idOwner: 1,
            numOfFutureItems: 0
          }
        );
        this.events = res.data;
      } catch (error) {
        let errMsg = "Errore nel recupero degli eventi: " +
          ((error.response && error.response.data && error.response.data.message) ||
            error.message || error);
        console.error(errMsg);
        alert(errMsg);
      }
    },
    async fetchReportsForEvent(event) {
      if (!event || !event.idCompany) {
        this.reports = [];
        return;
      }
      this.loadingReports = true;
      try {
        const res = await axios.post(
          `${API_BASE_URL}/agenda/getReportsByEvent`,
          { idEvent: event.idEvent }
        );
        this.reports = res.data;
      } catch (error) {
        this.reports = [];
        let errMsg = "Errore nel recupero dei report: " +
          ((error.response && error.response.data && error.response.data.message) ||
            error.message || error);
        console.error(errMsg);
        alert(errMsg);
      } finally {
        this.loadingReports = false;
      }
    },
    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.fetchEvents();
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.fetchEvents();
    },
    formatDateTime(date) {
      if (!date) return '';
      return dayjs(date).format('YY/MM/DD HH:mm');
    },
    openAddEventModal() {
      this.editedEvent = { owner: 1 };
      this.modalMode = 'edit';
    },
    openEditEventModal(event) {
      this.editedEvent = { ...event };
      this.modalMode = 'edit';
    },
    openEventDetails(event) {
      this.selectedEvent = event;
      this.modalMode = 'event';
      this.fetchReportsForEvent(event);
    },
    closeEventModal() {
      this.selectedEvent = null;
      this.modalMode = null;
    },
    closeEditEventModal() {
      this.editedEvent = null;
      this.modalMode = null;
    },
    saveEvent(event) {
      if (event.idEvent) {
        const idx = this.events.findIndex(e => e.idEvent === event.idEvent);
        if (idx !== -1) this.$set(this.events, idx, event);
      } else {
        event.idEvent = Date.now();
        this.events.push(event);
      }
      this.closeEditEventModal();
    },
    openCancelEventModal(event) {
      this.editedEvent = { ...event };
      this.modalMode = 'cancel';
    },
    closeCancelEventModal() {
      this.editedEvent = null;
      this.modalMode = null;
    },
    cancelEvent({ event, reason }) {
      const idx = this.events.findIndex(e => e.idEvent === event.idEvent);
      if (idx !== -1) {
        this.$set(this.events, idx, {
          ...event,
          cancelled: true,
          cancelReason: reason,
        });
      }
      this.closeCancelEventModal();
    },
    getIconPath(iconName) {
      try {
        return require(`@/assets/icons/${iconName}.png`);
      } catch (e) {
        return '';
      }
    },
    openEditReportModal(report) {
      this.selectedReport = report;
      this.showReportModal = true;
    },
    closeReportModal() {
      this.selectedReport = null;
      this.showReportModal = false;
    },
  }
  
};
</script>

<style>

.calendar {
  max-width: 700px;
  margin: 0 auto;
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.calendar-day {
  font-weight: bold;
  text-align: center;
  background: #f0f0f0;
  padding: 4px 0;
}
.calendar-cell {
  min-height: 60px;
  border: 1px solid #eee;
  padding: 2px;
  position: relative;
  background: #fff;
}
.agenda-list {
  margin: 24px 0;
}
.agenda-event {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.event-info {
  flex: 1;
  cursor: pointer;
}
.event-actions button {
  margin-left: 8px;
}
.cancelled-text {
  color: red;
  text-decoration: line-through;
}
.event-date {
  margin-left: 16px;
  color: #888;
  font-size: 0.95em;
}
.cancelled {
  opacity: 0.7;
}
</style>