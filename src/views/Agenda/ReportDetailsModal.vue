<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/Agenda/ReportDetailsModal.vue -->
<template>
  <div class="report-modal-overlay" style="background:rgba(0,0,0,0.7);">
    <div class="modal-content report-modal-content report-modal-flex">
      <!-- Main form -->
      <div class="report-main">
        <button class="modal-close" @click="$emit('close')">X</button>
        <h3>{{ isAdding ? 'Aggiungi' : 'Modifica' }} Report</h3>
        <input v-model="localReport.summary" placeholder="Sommario" style="width:100%; margin-bottom: 8px; font-size: 1.1em;" />
        <textarea v-model="localReport.report" placeholder="Testo" rows="8" style="width:100%"></textarea>
        <div style="margin-top:12px;">
          <button @click="save" class="save-btn">Salva</button>
          <button @click="$emit('close')" class="cancel-btn">Annulla</button>
        </div>
      </div>
      <!-- Side section: Participants -->
      <div class="report-side">
        <h4>Partecipanti</h4>
        <ul class="participants-list">
          <li v-for="person in participants" :key="person.idPerson">
            {{ person.familyName }} {{ person.firstName }} <span v-if="person.company">({{ person.company }})</span>
            <button class="remove-btn" @click="confirmRemove(person)">Rimuovi</button>
          </li>
        </ul>
        <div class="add-participant-section">
          <input
            v-model="personSearch"
            @input="onPersonSearch"
            placeholder="Aggiungi partecipante..."
            autocomplete="off"
          />
          <ul v-if="showPersonDropdown" class="person-dropdown">
            <li v-for="person in personResults" :key="person.idPerson" class="person-row">
              <input type="checkbox" class="person-checkbox" v-model="selectedToAdd" :value="person.idPerson" />
              <span class="person-cell lastname">{{ person.familyName }}</span>
              <span class="person-cell firstname">{{ person.firstName }}</span>
              <span class="person-cell company">{{ person.company }}</span>
            </li>
          </ul>
          <button v-if="showPersonDropdown && selectedToAdd.length" class="add-btn" @click="addSelectedParticipants">
            Aggiungi selezionati
          </button>
        </div>
      </div>
    </div>
    <!-- Confirm remove dialog -->
    <div v-if="confirmingPerson" class="confirm-overlay">
      <div class="confirm-dialog">
        <p>Rimuovere {{ confirmingPerson.familyName }} {{ confirmingPerson.firstName }} dai partecipanti?</p>
        <button @click="removeParticipant(confirmingPerson)">Sì</button>
        <button @click="confirmingPerson = null">No</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import Person from '@/types/Person';

export default {
  props: {
    report: Object,
    isAdding: Boolean
  },
  data() {
    return {
      localReport: { ...this.report },
      participants: [],
      personSearch: '',
      personResults: [],
      showPersonDropdown: false,
      searchTimeout: null,
      confirmingPerson: null,
      selectedToAdd: [],
    };
  },
  watch: {
    report(newVal) {
      this.localReport = { ...newVal };
      this.fetchParticipants();
    }
  },
  mounted() {
    this.fetchParticipants();
  },
  methods: {
    save() {
      this.$emit('save', this.localReport);
    },
    async fetchParticipants() {
      if (!this.report || !this.report.idEvent) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/events/getById?id=${this.report.idEvent}`);
        console.log('Fetched participants:', res.data);
        // If the server returns an array directly:
        this.participants = Array.isArray(res.data.participants) ? res.data.participants.map(p => new Person(p)) : [];
      } catch (e) {
        this.participants = [];
      }
    },
    confirmRemove(person) {
      this.confirmingPerson = person;
    },
    async removeParticipant(person) {
        await axios.post(`${API_BASE_URL}/events/manageParticipant`, {
          idEvent: this.report.idEvent,
          idPerson: person.idPerson,
          action: "del"
        });
      this.participants = this.participants.filter(p => p.idPerson !== person.idPerson);
      this.confirmingPerson = null;
      await this.fetchParticipants();
    },
    onPersonSearch() {
      clearTimeout(this.searchTimeout);
      if (this.personSearch.length < 3) {
        this.personResults = [];
        this.showPersonDropdown = false;
        this.selectedToAdd = [];
        return;
      }
      this.searchTimeout = setTimeout(this.fetchPersons, 400);
    },
    async fetchPersons() {
      try {
        const res = await axios.get(`${API_BASE_URL}/persons/getBySubstring?searchFor=${encodeURIComponent(this.personSearch)}`);
        this.personResults = res.data.map(p => new Person(p));
        this.showPersonDropdown = true;
        this.selectedToAdd = [];
      } catch (e) {
        this.personResults = [];
        this.showPersonDropdown = false;
        this.selectedToAdd = [];
      }
    },
    async addSelectedParticipants() {
      const toAdd = this.personResults.filter(p => this.selectedToAdd.includes(p.idPerson));
      for (const person of toAdd) {
        await axios.post(`${API_BASE_URL}/events/manageParticipant`, {
          idEvent: this.report.idEvent,
          idPerson: person.idPerson,
          action: "add"
        });
      }
      this.personSearch = '';
      this.personResults = [];
      this.showPersonDropdown = false;
      this.selectedToAdd = [];
      await this.fetchParticipants();
    }
  }
};
</script>

<style>
.report-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000; /* must be higher than .modal-overlay in EventDetailsModal.vue */
}

.report-modal-content {
  width: 90vw;
  min-width: 1040px;
  max-width: 1560px;
  min-height: 90vh;
  max-height: 98vh;
  height: 98vh;
  overflow-y: auto;
  display: flex;
  flex-direction: row;
  gap: 32px;
}

.report-modal-flex {
  display: flex;
  flex-direction: row;
  gap: 32px;
}

.report-main {
  flex: 2 1 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.report-main textarea {
  flex: 1 1 auto;
  resize: none;
  min-height: 200px;
  max-height: 100%;
  margin-bottom: 12px;
  width: 100%;
}

.report-side {
  flex: 1;
  background: #f7f7f7;
  border-radius: 8px;
  padding: 16px;
  min-width: 350px;
  max-width: 500px;
  box-sizing: border-box;
}
.participants-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1em 0;
}
.participants-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.remove-btn {
  background: #e57373;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 0.9em;
}
.add-participant-section {
  position: relative;
}
.add-participant-section input {
  width: 100%;
  box-sizing: border-box;
  padding: 4px;
}
.person-dropdown {
  font-size: 0.85em;
}

.person-row {
  display: grid;
  grid-template-columns: 24px 80px 60px 1fr; /* checkbox, family, first, company */
  align-items: center;
  gap: 4px;
  padding: 4px 2px;
  text-align: left;
}

.person-cell {
  text-align: left;
}

.person-checkbox {
  width: 16px;
  height: 16px;
  margin: 0 4px 0 0;
}

.person-cell.lastname {
  min-width: 60px;
  max-width: 100px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-cell.firstname {
  min-width: 40px;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-cell.company {
  min-width: 100px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-btn {
  margin-top: 6px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 0.95em;
}
.person-dropdown li:hover {
  background: #e3f2fd;
}
.confirm-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.confirm-dialog {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
}
</style>