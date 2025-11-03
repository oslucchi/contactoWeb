<template>
  <div class="generic-cell-editor">
    <textarea v-if="isText" ref="editor"
              :value="localValue"
              @input="onInput"
              @blur="onBlur"
              :readonly="!editable"
              class="gce-textarea"
              ></textarea>
    <input v-else ref="editor"
           :value="localValue"
           @input="onInput"
           @blur="onBlur"
           :readonly="!editable"
           class="gce-input"
           />
    <div v-if="loading" class="gce-loading">Saving…</div>
    <div v-if="error" class="gce-error">{{ error }}</div>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';

function normalizeDates(obj) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(normalizeDates);
  if (typeof obj === 'object') {
    const out = {};
    Object.keys(obj).forEach(k => out[k] = normalizeDates(obj[k]));
    return out;
  }
  if (typeof obj === 'string' && /\d{4}-\d{2}-\d{2}T/.test(obj)) {
    const tzFixed = obj.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
    const d = new Date(tzFixed);
    if (!isNaN(d)) return d.toISOString();
  }
  return obj;
}

export default {
  name: 'GenericCellEditor',
  props: {
    value: { type: [String, Number], default: '' },
    editable: { type: Boolean, default: false },
    editorType: { type: String, default: 'TEXT' }, // TEXT | INPUT
    editEndpoint: { type: String, default: '' },   // e.g. '/reports/update'
    editMethod: { type: String, default: 'PUT' },
    payloadTemplate: { type: String, default: '' }, // JSON string template
    rowId: { type: [String, Number], required: false },
    colName: { type: String, required: true },
    item: { type: Object, default: null } // entire item if template needs more fields
  },
  data() {
    return {
      localValue: this.value == null ? '' : String(this.value),
      originalValue: this.value == null ? '' : String(this.value),
      loading: false,
      error: null
    };
  },
  computed: {
    isText() { return (this.editorType || '').toUpperCase() === 'TEXT'; }
  },
  mounted() {
    // autofocus
    this.$nextTick(() => {
      if (this.$refs.editor && typeof this.$refs.editor.focus === 'function') {
        this.$refs.editor.focus();
        // caret at end
        try {
          const v = this.$refs.editor.value || '';
          this.$refs.editor.setSelectionRange(v.length, v.length);
        } catch (e) {}
      }
    });
  },
  methods: {
    onInput(e) {
      this.localValue = e && e.target ? e.target.value : String(e);
    },

    buildPayload() {
      if (this.localValue === this.originalValue) return;

      const updated = { ...(this.item || {}), [this.colName]: this.localValue };
      return { [this.colName]: normalizeDates(updated) }; 
    },

    async onBlur() {
      // basic guards
      if (!this.editable) { this.$emit('cancel'); return; }
      if (String(this.localValue) === String(this.originalValue)) {
        this.$emit('cellUnchanged', { col: this.colName, id: this.rowId });
        return;
      }

      // build payload safely
      let payload;
      try {
        payload = this.buildPayload();
      } catch (err) {
        console.error('GenericCellEditor: buildPayload failed', err);
        this.$emit('saveCellFailed', { id: this.rowId, col: this.colName, value: this.localValue, error: 'buildPayload failed', reason: err });
        return;
      }

      // optimistic emit (no res referenced here)
      const optimistic = { id: this.rowId, col: this.colName, value: this.localValue, item: this.item, payload, response: null, optimistic: true };
      console.log('GenericCellEditor: emitting optimistic savedCell', optimistic);
      try { 
        this.$emit('savedCell', optimistic); 
      } 
      catch (e) {
        console.error('GenericCellEditor: optimistic emit savedCell failed', e);
      }

      // if no endpoint, let parent persist
      if (!this.editEndpoint) {
        this.$emit('saveCell', { id: this.rowId, col: this.colName, value: this.localValue, item: this.item, payload });
        return;
      }

      // remote save
      this.loading = true;
      this.error = null;
      try {
        const url = (this.editEndpoint.startsWith('http') ? '' : API_BASE_URL) + this.editEndpoint;
        const m = (this.editMethod || 'PUT').toLowerCase();
        console.log('GenericCellEditor: calling', m.toUpperCase(), url, 'payload:', payload);
        const res = await axios[m](url, payload);
        this.originalValue = res && res.data ? String(res.data[this.colName] || this.localValue) : this.localValue;
        // emit confirmation with server response
        try { this.$emit('saveCellConfirm', { id: this.rowId, col: this.colName, value: this.localValue, item: this.item, payload, response: res && res.data }); }
        catch (e) { console.error('GenericCellEditor: emit save-confirm failed', e); }
      } catch (err) {
        console.error('GenericCellEditor: remote save failed', err);
        this.error = (err && err.response && err.response.data) ? JSON.stringify(err.response.data) : (err && err.message ? err.message : 'Save failed');
        this.$emit('saveCellFailed', { id: this.rowId, col: this.colName, value: this.localValue, item: this.item, error: this.error, reason: err });
      } finally {
        this.loading = false;
      }
    }
  },
  watch: {
    value(v) { this.localValue = v == null ? '' : String(v); this.originalValue = this.localValue; }
  }
};
</script>

<style scoped>
.gce-textarea, .gce-input {
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  resize: none;
  padding: 6px;
}
.gce-loading { font-size: 0.85em; color: #666; }
.gce-error { color: #b00; font-size: 0.9em; margin-top: 4px; }
</style>