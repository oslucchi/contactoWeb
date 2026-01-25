<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="modal-close" @click="$emit('close')">×</button>
      <h3>{{ isEditing ? 'Modifica' : 'Nuovo' }} Evento</h3>
      
      <div class="form-group">
        <label>Descrizione</label>
        <input v-model="localEvent.description" placeholder="Descrizione evento" />
      </div>
      
      <div class="form-group">
        <label>Data (DD/MM/YYYY)</label>
        <input 
          type="text" 
          v-model="displayDate" 
          @blur="parseDisplayDate"
          placeholder="DD/MM/YYYY"
          maxlength="10"
        />
      </div>
      
      <div class="form-group">
        <label>Ora (HH:MM)</label>
        <input 
          type="text" 
          v-model="displayTime"
          @blur="parseDisplayTime"
          placeholder="HH:MM"
          maxlength="5"
        />
      </div>
      
      <div class="form-group">
        <label>Azienda</label>
        <AutocompleteCombo
          v-model="selectedCompany"
          table="Companies"
          :searchColumns="['description']"
          :displayColumns="['description']"
          idField="idCompany"
          labelField="description"
          placeholder="Cerca azienda..."
          @select="onCompanySelect"
        />
      </div>
      
      <div class="form-group">
        <label>Categoria</label>
        <input v-model="localEvent.category" placeholder="Categoria" />
      </div>
      
      <div class="form-actions">
        <button class="btn-primary" @click="save">Salva</button>
        <button class="btn-secondary" @click="$emit('close')">Annulla</button>
      </div>
    </div>
  </div>
</template>
<script>
import dayjs from 'dayjs';
import AutocompleteCombo from '@/components/AutocompleteCombo.vue';
import { DATE_FORMATS } from '@/config/formatConfig';

export default {
  components: { AutocompleteCombo },
  props: { event: Object, isEditing: Boolean },
  data() {
    return { 
      localEvent: { ...this.event },
      eventDate: '',
      eventTime: '',
      displayDate: '',
      displayTime: '',
      selectedCompany: null
    };
  },
  mounted() {
    if (this.localEvent.date) {
      const dt = dayjs(this.localEvent.date);
      this.eventDate = dt.format(DATE_FORMATS.INPUT_DATE);
      this.eventTime = dt.format(DATE_FORMATS.INPUT_TIME);
      this.displayDate = dt.format(DATE_FORMATS.DISPLAY_DATE);
      this.displayTime = dt.format(DATE_FORMATS.DISPLAY_TIME);
    }
    // Set initial company if editing
    if (this.localEvent.idCompany) {
      this.selectedCompany = { 
        idCompany: this.localEvent.idCompany,
        description: this.localEvent.companyName || ''
      };
    }
  },
  methods: {
    parseDisplayDate() {
      // Parse DD/MM/YYYY to internal format
      const parts = this.displayDate.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        if (year.length === 4) {
          this.eventDate = `${year}-${month}-${day}`;
        }
      }
    },
    parseDisplayTime() {
      // Parse HH:MM format
      const parts = this.displayTime.split(':');
      if (parts.length === 2) {
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        this.eventTime = `${hours}:${minutes}`;
      }
    },
    onCompanySelect(company) {
      this.localEvent.idCompany = company.idCompany;
      this.localEvent.companyName = company.description;
    },
    save() { 
      // Parse display formats before saving
      this.parseDisplayDate();
      this.parseDisplayTime();
      
      // Combine date and time
      if (this.eventDate) {
        const timeStr = this.eventTime || '00:00';
        this.localEvent.date = dayjs(`${this.eventDate} ${timeStr}`).toISOString();
      }
      this.$emit('save', this.localEvent); 
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: transparent;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.modal-close:hover {
  color: #000;
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>