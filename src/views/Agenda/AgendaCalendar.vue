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
        <div class="calendar-day" v-for="day in daysOfWeek" :key="day">{{ day }}</div>
        <div v-for="cell in calendarCells" :key="cell.date" class="calendar-cell">
          <div class="cell-date">{{ cell.day }}</div>
          <div v-for="event in cell.events" :key="event.idEvent" class="event-block"
            @click="openEventModal(event)" style="cursor:pointer">
            <div style="display: flex; align-items: center;">
              <img v-if="event.iconName" :src="getIconPath(event.iconName)" :alt="event.iconName"
                class="calendar-event-icon" />
              <span class="event-duration">
                {{ new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                {{ event.duration }} min
              </span>
            </div>
            <div class="event-desc">{{ event.company.slice(0, 20) }}{{ event.company.length > 20 ? '…' : '' }}</div>
            <div class="event-desc">{{ event.description.slice(0, 20) }}{{ event.description.length > 20 ? '…' : '' }}</div>
          </div>
        </div>
      </div>
    </div>
    <EventDetailsModal
      v-if="modalMode === 'event'"
      :event="selectedEvent"
      :reports="reports"
      :loading="loadingReports"
      @close="closeEventModal"
      @add-report="addReport"
      @edit-report="updateReport"
    />
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import EventDetailsModal from './EventDetailsModal.vue';
import Report from '../../types/Report';
import dayjs from 'dayjs';

export default {
  components: { EventDetailsModal },
  data() {
    return {
      events: [],
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      selectedEvent: null,
      reports: [],
      loadingReports: false,
      selectedReport: null,
      editedReport: null,
      isAddingReport: false,
      modalMode: null, // 'event'
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
        const cellDateStr = cellDate.toISOString().slice(0, 10);
        const events = this.events.filter(ev => ev.date && ev.date.startsWith(cellDateStr));
        cells.push({ date: cellDateStr, day: d, events });
      }
      return cells;
    }
  },
  methods: {
    async fetchEvents() {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/agenda/schedule`,
          { idOwner: 1, numOfFutureItems: 0 }
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
    async openEventModal(event) {
      this.selectedEvent = event;
      this.modalMode = 'event';
      this.reports = [];
      if (event.idCompany) {
        this.loadingReports = true;
        try {
          const res = await axios.post(`${API_BASE_URL}/agenda/getReports`, {
            idCompany: event.idCompany
          });
          this.reports = res.data;
        } catch (error) {
          alert("Errore nel recupero dei report: " + (error.response && error.response.data && error.response.data.message || error.message || error));
        } finally {
          this.loadingReports = false;
        }
      }
    },
    getIconPath(iconName) {
      try {
        return require(`@/assets/icons/${iconName}.png`);
      } catch (e) {
        return '';
      }
    },
    closeEventModal() {
      this.modalMode = null;
      this.selectedEvent = null;
      this.reports = [];
    },

    async addReport(report) {
        const formattedReport = {
            ...report,
            date: dayjs(report.date).valueOf()
        };
        console.log("Updating report:", formattedReport);
        try {
          const res = await axios.post(
                            `${API_BASE_URL}/reports/add`, 
                            {
                                report: formattedReport
                            }
                        );
          this.reports.push(res.data);
        } catch (error) {
            alert("Errore nell'inserimento report: " + (error.response && error.response.data && error.response.data.message || error.message || error));
        }
    },
    async updateReport(report) {
        const formattedReport = {
            ...report,
            date: dayjs(report.date).valueOf()
        };
        console.log("Updating report:", formattedReport);
        try {
            const res = await axios.post(
                            `${API_BASE_URL}/reports/update`, 
                            {
                                report: formattedReport
                            }
                        );
            const idx = this.reports.findIndex(r => r.idReport === formattedReport.idReport);
            if (idx !== -1) this.$set(this.reports, idx, formattedReport);  
        } catch (error) {
            alert("Errore nell'inserimento report: " + (error.response && error.response.data && error.response.data.message || error.message || error));
        }
    },
  },
  created() {
    this.fetchEvents();
  }
};
</script>

<style scoped>
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
.calendar-event-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  margin-right: 4px;
  vertical-align: middle;
}
.cell-date {
  font-size: 0.9em;
  font-weight: bold;
  margin-bottom: 2px;
}
.event-block {
  background: #e3f2fd;
  border-radius: 4px;
  margin-bottom: 2px;
  padding: 2px 4px;
  font-size: 0.85em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.event-duration {
  color: #1976d2;
  font-weight: bold;
  font-size: 0.8em;
}
.event-desc {
  color: #333;
}
</style>