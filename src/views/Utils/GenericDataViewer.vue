<template>
  <div class="generic-data-viewer-root" :style="rootContainerStyle" @click="onRootClick">
    <div class="masterdata-content" ref="masterdataContent">
      <!-- Action bar -->
      <div class="action-icons">
        <span v-if="featuresEnabled[3]">
          <SearchByString
            :placeholder="searchPlaceholder"
            @input="onSearchInput"
          />
        </span>
        <button v-if="featuresEnabled[0]" :disabled="selectedRowId === null" @click.stop="openEditModal">
          <img src="@/assets/icons/pencil.png" alt="Edit" class="icon" />
        </button>
        <button v-if="featuresEnabled[1]" :disabled="selectedRowId === null" @click.stop="deleteSelectedRow">
          <img src="@/assets/icons/recycle-bin.png" alt="Delete" class="icon" />
        </button>
        <button v-if="featuresEnabled[2]" @click.stop="addNewItem">
          <img src="@/assets/icons/add.png" alt="Add" class="icon" />
        </button>
        <span v-if="showTitle" class="action-right">{{ showTitle }}</span>
      </div>

      <!-- table container -->
      <div class="masterdata-table-container" :style="{ height: tableHeight + 'px', padding: '2px 2px 0 2px' }">
        <div class="masterdata-table-header" ref="headerRef">
          <table class="masterdata-table" :style="{ minWidth: localTableWidth + 'px' }">
            <colgroup>
              <col v-for="col in visibleColumns" :key="col.idColConfigDetail"
                :style="{ width: (col.width || 120) + 'px' }" />
            </colgroup>
            <thead>
              <tr>
                <th v-for="(col, i) in visibleColumns" :key="col.idColConfigDetail"
                  @click="col.useForSort && handleSort(col.colName)">
                  {{ col.showName }}
                  <span v-if="sortColumn === col.colName" class="sort-arrow">{{ sortDirection === 'asc' ? '▲' : '▼'}}</span>
                  <span class="col-resizer" @mousedown.stop.prevent="startResize($event, col, i)"
                    title="Resize column"></span>
                </th>
              </tr>
            </thead>
          </table>
        </div>

        <div class="masterdata-tbody-scroll" ref="tbodyScroll" @scroll="syncHeaderScroll"
          :style="{ height: bodyHeight + 'px' }">
          <table class="masterdata-table" :style="{ minWidth: localTableWidth + 'px' }">
            <colgroup>
              <col v-for="col in visibleColumns" :key="col.idColConfigDetail"
                :style="{ width: (col.width || 120) + 'px' }" />
            </colgroup>
            <tbody>
              <tr 
                v-for="(item, rowIdx) in sortedItems" 
                :key="getRowIdFromData(item, rowIdx)"
                :data-rowid="getRowIdFromData(item, rowIdx)"
                :class="{ 'row-selected': selectedRowId === getRowIdFromData(item, rowIdx) }"
              >
                <td 
                    v-for="col in visibleColumns" 
                    :key="col.idColConfigDetail"
                    :class="{ 'td-editable': selectedRowId === getRowIdFromData(item, rowIdx) && selectedCell === col.colName && featuresEnabled[4] }"
                    @click.stop="handleCellClick($event, item, rowIdx, col)"
                >
                  <div 
                    v-if="item[col.colName] !== undefined"
                    class="cell-wrapper"
                  >
                    <div 
                        v-if="col.renderLayout && String(col.renderLayout).trim() !== '' && hasValue(item, col)"
                        class="cell-content"
                        v-ellipsis="() => getCellTitle(item, col)"
                    >
                      <div v-if="selectedCell === col.colName && (col.editable || isTextLayout(col) && isTextEditable(col))">
                        <GenericCellEditor
                          :value="item[col.colName]"
                          :editable="!!(col.editable || (isTextLayout(col) && isTextEditable(col)))"
                          :editorType="isTextLayout(col) ? 'TEXT' : 'INPUT'"
                          :editEndpoint="col.editEndpoint || ''"
                          :editMethod="col.editMethod || 'PUT'"
                          :payloadTemplate="col.editPayloadTemplate || ''"
                          :rowId="getRowIdFromData(item, rowIdx)"
                          :colName="col.colName"
                          :item="item"
                          @cellUnchanged="onCellUnchanged"
                          @saveCell="onCellSave"
                          @savedCell="onCellSaved"
                          @saveCellFailed="onSaveCellFailed"
                          @saveCellConfirm="onSaveCellConfirm"
                        />
                      </div>
                      <div 
                          v-else 
                          :style="mergeCellStyle(item, col)"
                          v-html="renderCellHtml(item, col)">
                      </div>
                    </div>
                    <div 
                        v-else 
                        class="cell-content" 
                        v-ellipsis="() => getCellTitle(item, col)" 
                    >
                      <span class="cell-text">
                        {{ item[col.colName] }}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Edit Modal -->
      <div v-if="showEditModal" class="modal-overlay" @click.stop>
        <div class="modal-content">
          <button class="modal-close" @click="showEditModal = false">X</button>
          <h3>Edit {{ tableConfig.table }}</h3>
          <div>
            <pre>{{ selectedItem }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SearchByString  from '@/components/SearchByString.vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import ColConfigHeader from '@/types/ColConfigHeader';
import DOMPurify from 'dompurify';
import GenericCellEditor from '@/views/Utils/GenericCellEditor.vue';

const _ellipsisThunks = new WeakMap();
let _ellipsisScheduled = false;

function getClassByName(name) {
  if (!name) return Object;
  try {
    const mod = require(`@/types/${name}`);
    return (mod && mod.default) ? mod.default : mod;
  } catch (e) {
    console.error(`getClassByName: could not load class "${name}", returning Object fallback`, e);
    return Object;
  }
}

function applyEllipsis(el) {
  el.style.overflow = 'hidden';
  el.style.textOverflow = 'ellipsis';
  el.style.whiteSpace = 'nowrap';
  el.style.display = 'block';
  el.style.maxWidth = '100%';
  el.style.boxSizing = 'border-box';

  const clientW = el.clientWidth;
  const scrollW = el.scrollWidth;
  const isOverflowing = scrollW > clientW;

  if (isOverflowing) {
    el.classList.add('is-cropped');
    let titleText = '';
    try {
      const thunk = _ellipsisThunks.get(el);
      if (typeof thunk === 'function') titleText = String(thunk() || '').trim();
      else titleText = (typeof thunk === 'string') ? thunk.trim() : (el.textContent || '').trim();
    } catch (e) {
      titleText = (el.textContent || '').trim();
    }
    if (titleText) el.setAttribute('title', titleText);
    else el.removeAttribute('title');
  } else {
    el.classList.remove('is-cropped');
    el.removeAttribute('title');
  }
}

export default {
  name: 'GenericDataViewer',
  components: { 
    SearchByString, 
    GenericCellEditor
  },
  props: {
    page: { type: String, required: true },
    element: { type: String, required: true },
    user: { type: Number, required: true },
    filter: { type: Object, default: () => ({}) },
    featuresEnabled: { type: Array, default: () => [false, false, false, false, false] },
    tableHeight: { type: Number, required: true },
    containerWidth: { type: Number, required: true },
    preserveRightSpace: { type: Number, default: 0 },
    listenEvents: { type: Array, default: () => [] },
  },
  emits: ['rowSelected'],
  data() {
    return {
      _cellOriginalContent: {},

      tableConfig: { table: this.element, columns: [] },
      _itemsSource: [],
      items: [],

      columnsToSearch: [],
      searchPlaceholder: '',

      selectedRowId: null,
      selectedCell: null,
      showEditModal: false,
      selectedItem: null,
      sortColumn: null,
      sortDirection: null,
      tableRenderKey: 0,
      localBodyHeight: 0,
      localTableWidth: 0,
      effectiveContainerWidth: 0,
      _externalListeners: [],
    };
  },

  mounted() {
    window.addEventListener('resize', this.calculateTableDimensions);
    this.calculateTableDimensions();

    if (Array.isArray(this.listenEvents) && this.listenEvents.length) {
      this.listenEvents.forEach(evtName => {
        const handler = () => { this.reloadData(); };
        this._externalListeners.push({ evtName, handler });
        if (this.$root && this.$root.$on) this.$root.$on(evtName, handler);
      });
    }
  },
  
  beforeDestroy() {
    window.removeEventListener('resize', this.calculateTableDimensions);
    if (this._externalListeners && this._externalListeners.length && this.$root && this.$root.$off) {
      this._externalListeners.forEach(({ evtName, handler }) => {
        this.$root.$off(evtName, handler);
      });
    }
  },

  computed: {
    rootContainerStyle() {
      return { width: '100%' };
    },

    bodyHeight() { 
      return this.localBodyHeight || (this.tableHeight - 28); 
    },

    visibleColumns() {
      const cols = (this.tableConfig && Array.isArray(this.tableConfig.columns)) ? this.tableConfig.columns : [];
      return cols
        .filter(col => (col.visible === 1 || col.visible === '1' || col.visible === true || col.visible === 'Y' || col.visible === 'y'))
        .sort((a, b) => (a.position || 0) - (b.position || 0));
    },

    sortedItems() {
      if (!this.sortColumn || !this.sortDirection) return this.items;
      return [...this.items].sort((a, b) => {
        let valA = a[this.sortColumn] || '';
        let valB = b[this.sortColumn] || '';
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    },
    
    itemIdField() {
      if (this.tableConfig && this.tableConfig.primaryKey) {
        return this.tableConfig.primaryKey;
      }
      if (!this.tableConfig || !this.tableConfig.columns) return null;
      let idCol = this.tableConfig.columns.find(col => col.colName && col.colName.toLowerCase().startsWith('id'));
      if (!idCol) idCol = this.tableConfig.columns.find(col => col.position === 0);
      return idCol ? idCol.colName : null;
    },
    
    showTitle() {
      return this.tableConfig && this.tableConfig.showTitle ? this.tableConfig.showTitle : '';
    },
  },

  async created() {
    console.log('GenericDataViewer: created started', { page: this.page, element: this.element });

    try {
      const configRes = await axios.get(`${API_BASE_URL}/utility/browserData`, {
        params: { page: this.page, element: this.element, user: this.user }
      });
      const cfg = configRes && configRes.data ? configRes.data : null;
      if (!cfg || (cfg.columns && !Array.isArray(cfg.columns))) {
        console.warn('browserData returned invalid config:', cfg);
        this.tableConfig = { table: this.element, columns: [], cliClassName: null, restModuleName: null, dataCollectMethod: null };
        this.items = [];
        this._itemsSource = [];
        return;
      }
      this.tableConfig = new ColConfigHeader(cfg);
      
      if (!this.tableConfig.cliClassName || !this.tableConfig.restModuleName || !this.tableConfig.dataCollectMethod) {
        console.warn('Missing required config fields:', this.tableConfig);
        this.items = [];
        this._itemsSource = [];
        return;
      }

      const ClassType = getClassByName(this.tableConfig.cliClassName);
      const dataRes = await axios.get(
        `${API_BASE_URL}/${this.tableConfig.restModuleName}/${this.tableConfig.dataCollectMethod}`, 
        { params: { ...(this.filter || {}), rawData: true } }
      );

      if (!dataRes || !dataRes.data) {
        console.warn('No data received from API');
        this.items = [];
        this._itemsSource = [];
        return;
      }

      this.items = Array.isArray(dataRes.data) ? dataRes.data.map(obj => {
        const item = obj instanceof ClassType ? obj : new ClassType(obj);
        (this.tableConfig.columns || []).forEach(col => {
          if (!(col.colName in item)) item[col.colName] = '';
        });
        return item;
      }) : [];

      this._itemsSource = [...this.items];
      this.setupSearchColumns();
      
      this.$nextTick(() => {
        this.calculateTableDimensions();
        this.refreshEllipsis();
      });
      console.log('GenericDataViewer: config loaded', this.tableConfig);
      console.log('GenericDataViewer: items loaded', this.items.length, 'items');
      console.log('GenericDataViewer: columns', this.visibleColumns);
      const textColumns = this.visibleColumns.filter(col => this.isTextLayout(col));
      console.log('GenericDataViewer: TEXT layout columns', textColumns);

    } 
    catch (err) {
      console.error('created() failed:', err);
      this.tableConfig = { table: this.element, columns: [] };
      this.items = [];
      this._itemsSource = [];
    }
  },

  directives: {
    ellipsis: {
      inserted(el, binding) {
        el.setAttribute('data-ellipsis', '1');
        if (binding && binding.value) {
          _ellipsisThunks.set(el, typeof binding.value === 'function' ? binding.value : () => binding.value);
        } else {
          _ellipsisThunks.set(el, null);
        }
      },
      componentUpdated(el, binding) {
        if (binding && binding.value) {
          _ellipsisThunks.set(el, typeof binding.value === 'function' ? binding.value : () => binding.value);
        } else {
          _ellipsisThunks.set(el, null);
        }
      },
      unbind(el) {
        el.removeAttribute('data-ellipsis');
        _ellipsisThunks.delete(el);
      }
    }
  },

  methods: {
    setupSearchColumns() {
      this.searchPlaceholder = '';
      this.columnsToSearch = [];
      const cols = Array.isArray(this.tableConfig.columns) ? this.tableConfig.columns : [];
      
      let sep = "";
      cols.forEach(col => {
        const useInSearch = col && col.useInSearch;
        const name = col && col.showName;
        const colName = col && col.colName;
        if (useInSearch && name && colName) {
          this.searchPlaceholder += sep + String(name).substring(0, 5);
          this.columnsToSearch.push(col.colName);
          sep = ', ';
        }
      });
    },

    onCellUnchanged() {
      this.deselectRow();
    },

    onCellSave(payload) {
      console.log('onCellSave payload', payload);
      const item = this.items.find(i => this.getRowIdFromData(i) === payload.id);
      if (item) item[payload.col] = payload.value;
      this.deselectRow();
    },

    onCellSaved(payload) {
      console.log('GenericDataViewer: onCellSaved called with payload', payload);
      try {
        const { id, col, value, response } = payload || {};

        const updateItemInArray = (arr) => {
          const idx = arr.findIndex(i => String(this.getRowIdFromData(i)) === String(id));
          if (idx === -1) return false;
          
          if (response && typeof response === 'object') {
            Object.keys(response).forEach(k => {
              if (this.$set) this.$set(arr[idx], k, response[k]);
              else arr[idx][k] = response[k];
            });
          } else {
            if (this.$set) this.$set(arr[idx], col, value);
            else arr[idx][col] = value;
          }
          return true;
        };

        if (!updateItemInArray(this.items)) {
          updateItemInArray(this._itemsSource);
        }
      } catch (e) {
        console.warn('onCellSaved update failed', e);
      } finally {
        this.deselectRow();
      }
    },

    onSaveCellFailed(payload) {
      console.warn('onSaveCellFailed', payload);
      this.deselectRow();
    },
    
    onSaveCellConfirm(payload) {
      this.onCellSaved(payload);
    },

    onRootClick(evt) {
      try {
        const target = evt && evt.target ? evt.target : null;
        if (target && target.closest && target.closest('textarea')) {
          return;
        }
      } catch (e) { /* ignore */ }
      setTimeout(() => { this.deselectRow(); }, 0);
    },

    async handleCellClick(evt, item, rowIdx, col) {
      const rowId = this.getRowIdFromData(item, rowIdx);
      if (this.selectedRowId !== rowId) {
        this.selectRow(item, rowIdx);
        await this.$nextTick();
      }
      this.selectCell(item, rowIdx, col.colName);
    },
    
    isTextLayout(col) {
      return col && col.renderLayout && String(col.renderLayout).trim().toUpperCase().startsWith('TEXT');
    },
    
    isTextEditable(col) {
      return col && col.renderLayout && /\bEDIT\b/i.test(String(col.renderLayout || ''));
    },

    _toDate(value) {
      if (value == null || value === '') return null;
      if (value instanceof Date) return value;
      if (typeof value === 'number') {
        return new Date(value < 1e12 ? value * 1000 : value);
      }
      const d = new Date(value);
      return isFinite(d) ? d : null;
    },

    formatDate(value, layout = 'YY-MM-DD HH:mm') {
      const d = this._toDate(value);
      if (!d) return '';
      const pad = n => String(n).padStart(2, '0');
      const tokens = {
        'YYYY': String(d.getFullYear()),
        'YY': String(d.getFullYear()).slice(-2),
        'MM': pad(d.getMonth() + 1),
        'DD': pad(d.getDate()),
        'HH': pad(d.getHours()),
        'mm': pad(d.getMinutes()),
        'ss': pad(d.getSeconds())
      };
      return layout.replace(/YYYY|YY|MM|DD|HH|mm|ss/g, t => tokens[t] || t);
    },

    formatNumber(value, layout = '0.00') {
      if (value == null || value === '') return '';
      const n = Number(value);
      if (!isFinite(n)) return String(value);
      const dotIdx = String(layout).indexOf('.');
      let minDecimals = 0;
      if (dotIdx >= 0) {
        const frac = layout.slice(dotIdx + 1);
        minDecimals = (frac.match(/0/g) || []).length;
      }
      return n.toLocaleString(undefined, { minimumFractionDigits: minDecimals, maximumFractionDigits: Math.max(minDecimals, 6) });
    },

    onSearchInput(value) {
      const v = value == null ? '' : String(value).trim();
      if (v.length < 3) {
        this.items = [...this._itemsSource];
        return;
      }

      const term = v.toLowerCase();
      this.items = (this._itemsSource || []).filter(item => {
        return this.columnsToSearch.some(colName => {
          const raw = item ? item[colName] : null;
          return raw != null && String(raw).toLowerCase().includes(term);
        });
      });
    },

    mergeCellStyle(item, col) {
      const base = { flex: '1 1 auto', minWidth: '0' };
      if (!col || !col.style) return base;
      
      let cssText = '';
      if (item && (col.style in item)) {
        cssText = item[col.style] == null ? '' : String(item[col.style]);
      }

      return cssText ? (cssText.endsWith(';') ? cssText : cssText + ';') : '';
    },

    refreshEllipsis() {
      if (_ellipsisScheduled) return;
      _ellipsisScheduled = true;
      
      const runner = (cb) => {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(cb, { timeout: 250 });
        } else {
          window.requestAnimationFrame(cb);
        }
      };
      
      runner(() => {
        _ellipsisScheduled = false;
        if (!this.$el) return;
        
        const nodes = this.$el.querySelectorAll('[data-ellipsis="1"]');
        if (!nodes || !nodes.length) return;
        
        nodes.forEach(el => {
          try {
            const thunk = _ellipsisThunks.get(el);
            applyEllipsis(el, thunk);
          } catch (e) {
            // ignore per-element errors
          }
        });
      });
    },
    
    getCellTitle(item, col) {
      const name = this.getCellName(col);
      let v = name && item ? item[name] : '';
      if (v == null) v = '';
      
      if (typeof v === 'string' && /<[^>]+>/.test(v)) {
        const tmp = document.createElement('div');
        tmp.innerHTML = v;
        return (tmp.textContent || tmp.innerText || '').trim();
      }
      return String(v).trim();
    },

    getCellName(col) {
      if (!col) return null;
      return col.renderField || col.colName || null;
    },

    hasValue(item, col) {
      if (!item || !col) return false;
      const name = this.getCellName(col);
      if (!name) return false;
      const v = item[name];
      return v !== null && v !== undefined && v !== '';
    },

    renderCellHtml(item, col) {
      const raw = item && col && (col.colName in item) ? item[col.colName] : '';
      if (!col || !col.renderLayout) return DOMPurify.sanitize(this.escapeHtml(raw == null ? '' : String(raw)));
      
      const layoutStr = String(col.renderLayout || '').trim();
      if (!layoutStr) return DOMPurify.sanitize(this.escapeHtml(raw == null ? '' : String(raw)));

      const firstSpace = layoutStr.indexOf(' ');
      const type = (firstSpace > 0 ? layoutStr.slice(0, firstSpace) : layoutStr).toUpperCase();
      const fmt = (firstSpace > 0 ? layoutStr.slice(firstSpace + 1).trim() : '');

      let html = '';
      switch (type) {
        case 'ICON': {
          const iconName = item && col && (col.colName in item) ? String(item[col.colName] || '').trim() : '';
          if (iconName) {
            const resolved = this.iconSrcFor(iconName);
            const s = this.escapeAttr(resolved);
            const alt = this.escapeAttr(iconName);
            let h = 20;
            if (fmt) {
              const m = fmt.match(/^(\d+)(?:x(\d+))?/);
              if (m) { h = parseInt(m[1], 10) || 20; }
            }
            html = `<img class="cell-icon" 
                        style="width:100%;max-width:100%;height:${h}px;max-height:${h}px;object-fit:contain;"
                        src="${s}" alt="${alt}"/>`;
          } else {
            html = this.escapeHtml(raw == null ? '' : String(raw));
          }
          break;
        }
        case 'DATETIME':
        case 'DATE': {
          const formatted = this.formatDate(raw, fmt || 'YY-MM-DD HH:mm');
          html = `<span>${this.escapeHtml(formatted)}</span>`;
          break;
        }
        case 'NUMBER':
        case 'NUM': {
          const formatted = this.formatNumber(raw, fmt || '0.00');
          html = `<span style="white-space:nowrap">${this.escapeHtml(formatted)}</span>`;
          break;
        }
        case 'HTML': {
          html = String(raw || '');
          break;
        }
        case 'TEXT': {
          const content = this.escapeHtml(raw == null ? '' : String(raw));
          const editable = /\bEDIT\b/i.test(fmt || '');
          // FIX: Remove height styling to prevent cell resizing
          html = '<textarea class="cell-textarea"' + (editable ? '' : ' readonly aria-readonly="true"') + ' style="height: auto !important; min-height: auto !important;">' + content + '</textarea>';
          break;
        }
        default:
          html = this.escapeHtml(raw == null ? '' : String(raw));
      }

      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['img', 'span', 'textarea'],
        ALLOWED_ATTR: ['src', 'alt', 'class', 'style', 'readonly', 'aria-readonly']
      });
    },
    escapeHtml(s) {
      if (s == null) return '';
      return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    },
    
    escapeAttr(s) {
      return this.escapeHtml(s).replace(/"/g, '&quot;');
    },

    iconSrcFor(name) {
      if (name == null) return '';
      const base = String(name).trim();
      if (!base) return '';
      
      try {
        const r = require(`@/assets/icons/${base}`);
        return (typeof r === 'string') ? r : (r.default || r);
      } catch (e) {
        return `/assets/icons/${encodeURIComponent(base)}.png`;
      }
    },

    calculateTableDimensions() {
      const parentEl = this.$el && this.$el.parentElement ? this.$el.parentElement : null;
      const parentWidth = parentEl ? parentEl.clientWidth || parentEl.offsetWidth : (window.innerWidth || document.documentElement.clientWidth || 0);
      const specified = (typeof this.containerWidth === 'number' && this.containerWidth > 0) ? this.containerWidth : parentWidth;

      let headerH = 28;
      if (this.$refs && this.$refs.headerRef && this.$refs.headerRef.offsetHeight) {
        headerH = this.$refs.headerRef.offsetHeight;
      }

      this.localBodyHeight = Math.max(0, this.tableHeight - headerH - 6);

      const preserve = (typeof this.containerWidth === 'number' && this.containerWidth > 0) ? 0 : Math.max(0, this.preserveRightSpace || 0);
      this.effectiveContainerWidth = Math.max(0, Math.round(Math.max(0, specified - preserve)));

      const totalColWidth = this.visibleColumns.reduce((sum, col) => sum + (Number(col.width) || 120), 0);
      this.localTableWidth = Math.max(totalColWidth, 50);

      this.refreshEllipsis();

      this.$nextTick(() => {
        const body = this.$refs && this.$refs.tbodyScroll;
        const header = this.$refs && this.$refs.headerRef;
        if (body && header) {
          const sb = body.offsetWidth - body.clientWidth;
          header.style.paddingRight = sb > 0 ? sb + 'px' : '0px';
        }
      });
    },

    handleSort(colName) {
      if (!colName) return;
      if (this.sortColumn !== colName) {
        this.sortColumn = colName;
        this.sortDirection = 'asc';
      } else if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else {
        this.sortColumn = null;
        this.sortDirection = null;
      }
    },

    getRowIdFromData(item, rowIdx) {
      const idValue = item && this.itemIdField ? item[this.itemIdField] : undefined;
      return (idValue !== null && idValue !== undefined) ? idValue : rowIdx;
    },

    selectRow(item, rowIdx) {
      this.selectedRowId = this.getRowIdFromData(item, rowIdx);
      this.selectedItem = item;
      this.selectedCell = null;
      this.emitStructuredSelection(item, rowIdx);
    },

    selectCell(item, rowIdx, colName) {
      this.selectedCell = colName;
      this.selectedItem = item;
      this.tableRenderKey++;
      
      // FIX: Ensure _cellOriginalContent exists before accessing it
      if (!this._cellOriginalContent) {
        this._cellOriginalContent = {};
      }
      
      // snapshot original content for editable cells so we can detect changes on blur
      try {
        const rowId = this.getRowIdFromData(item, rowIdx);
        const key = `${rowId}::${colName}`;
        this._cellOriginalContent[key] = item && (colName in item) ? (item[colName] == null ? '' : String(item[colName])) : '';
      } catch (e) { 
        console.warn('selectCell: failed to set original content', e);
      }
    },

    syncHeaderScroll(e) {
      const scrollLeft = e.target.scrollLeft;
      const header = this.$refs && this.$refs.headerRef;
      if (header) {
        const headerTable = header.querySelector('table');
        if (headerTable) headerTable.style.transform = `translateX(${-scrollLeft}px)`;
      }
    },

    startResize(evt, col, index) {
      if (!col) return;
      const startX = evt.pageX;
      const startWidth = Number(col.width) || 120;
      const body = document.body;
      const oldCursor = body.style.cursor;
      body.style.cursor = 'col-resize';

      const onMove = (e) => {
        const delta = e.pageX - startX;
        let next = Math.max(40, Math.min(1200, startWidth + delta));
        col.width = Math.round(next);
        this.refreshEllipsis();
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        body.style.cursor = oldCursor || '';
        this.saveColConfig({ ...col });
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },

    async saveColConfig(col) {
      try {
        const payload = { column: col };
        await axios.put(`${API_BASE_URL}/utility/colConfigDetail/${col.idColConfigDetail || 0}`, payload);
      } catch (err) {
        console.warn('saveColConfig failed', err);
      }
    },

    async reloadData() {
      if (!this.tableConfig.cliClassName || !this.tableConfig.restModuleName || !this.tableConfig.dataCollectMethod) {
        console.warn('Missing required config fields:', this.tableConfig);
        this.items = [];
        return;
      }

      const ClassType = getClassByName(this.tableConfig.cliClassName);
      try {
        const dataRes = await axios.get(
          `${API_BASE_URL}/${this.tableConfig.restModuleName}/${this.tableConfig.dataCollectMethod}`, 
          { params: this.filter }
        );
        
        this.items = Array.isArray(dataRes.data) ? dataRes.data.map(obj => {
          const item = obj instanceof ClassType ? obj : new ClassType(obj);
          (this.tableConfig.columns || []).forEach(col => { 
            if (!(col.colName in item)) item[col.colName] = ''; 
          });
          return item;
        }) : [];
        
        this._itemsSource = [...this.items];
        this.selectedRowId = null;
        this.selectedCell = null;
      } catch (err) {
        console.error('Failed loading data', err);
        this.items = [];
      }
      
      this.$nextTick(() => {
        this.calculateTableDimensions();
        this.refreshEllipsis();
      });
    },

    emitStructuredSelection(item, rowIdx) {
      const id = this.getRowIdFromData(item, rowIdx);
      const elementName = this.element;
      const payload = { element: elementName, idField: this.itemIdField || null, id, item };
      this.$emit('rowSelected', payload);
    },

    openEditModal() {
      if (this.selectedRowId !== null) {
        this.selectedItem = this.items.find(item => this.getRowIdFromData(item) === this.selectedRowId);
        this.showEditModal = true;
      }
    },
    
    deleteSelectedRow() {
      if (this.selectedRowId !== null) {
        const item = this.items.find(item => this.getRowIdFromData(item) === this.selectedRowId);
        if (confirm(`Delete ${this.tableConfig.element} ${item[this.visibleColumns[0].colName]}?`)) {
          axios.delete(`${API_BASE_URL}/${this.tableConfig.restModuleName}/${item[this.itemIdField]}`).then(() => {
            this.items = this.items.filter(i => this.getRowIdFromData(i) !== this.selectedRowId);
            this.selectedRowId = null;
          });
        }
      }
    },
    
    async addNewItem() {
      const ClassType = getClassByName(this.tableConfig.cliClassName);
      const newItem = new ClassType();
      const res = await axios.post(`${API_BASE_URL}/${this.tableConfig.restModuleName}/create`, newItem);
      this.items.push(res.data);
      this.selectedRowId = this.getRowIdFromData(res.data, this.items.length - 1);
      this.selectedCell = this.visibleColumns[0].colName;
    },
    
    deselectRow() { 
      this.selectedRowId = null; 
      this.selectedCell = null; 
      this.selectedItem = null; 
    },
  },

  watch: {
    tableHeight() {
      this.$nextTick(() => { this.calculateTableDimensions(); });
    },
    filter: {
      handler() { this.reloadData(); },
      deep: true
    }
  }
};
</script>

<style scoped>
.action-icons {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.action-icons .action-right {
  margin-left: auto;
  font-size: 1.5rem;
  font-style: italic;
  color: rgb(114, 173, 69);
  padding-right: 8px;
}

.icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}

.generic-data-viewer-root,
.masterdata-content,
.masterdata-table-container {
  box-sizing: border-box;
}

.generic-data-viewer-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.masterdata-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  border: 1px solid rgba(0, 0, 0, 0.6);
}

.masterdata-table-container {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 2px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.masterdata-table-header {
  flex: 0 0 auto;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.masterdata-tbody-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.masterdata-table {
  width: auto;
  min-width: 0;
  table-layout: fixed;
  border-collapse: collapse;
}

.masterdata-table th,
.masterdata-table td {
  border: 1px solid #888;
  padding: 2px 6px;
  text-align: left;
  background: #fff;
  height: 18px;
  vertical-align: middle;
  box-sizing: border-box;
}

.masterdata-table th {
  background: #f0f0f0;
  position: relative;
  user-select: none;
  cursor: pointer;
}

.masterdata-table td {
  overflow: hidden;
  position: relative;
}

.masterdata-table tbody tr:nth-child(odd) td {
  background: #fff;
}

.masterdata-table tbody tr:nth-child(even) td {
  background: #eaeaea;
}

.masterdata-table tbody tr:hover td {
  background: #dcf8c6ab !important;
}

.row-selected td {
  background: #DCF8C6 !important;
}

.cell-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  min-width: 0;
  overflow: hidden;
}

.cell-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
}

.cell-text {
  display: inline-block;
  vertical-align: middle;
  max-width: 100%;
  box-sizing: border-box;
}

.td-editable {
  border: 2px solid #1900fd !important;
}

/* FIX: Prevent textarea from changing cell height */
.cell-content >>> textarea.cell-textarea,
.masterdata-table td >>> textarea.cell-textarea {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  height: 100% !important;
  min-height: 100% !important;
  max-height: 100% !important;
  white-space: pre-wrap !important;
  word-break: break-word;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.2;
  resize: none !important;
  padding: 2px 4px;
  border: 0;
  background: transparent;
}

.sort-arrow {
  position: absolute;
  right: 6px;
  bottom: 2px;
  font-size: 1em;
  color: #222;
  pointer-events: none;
}

.col-resizer {
  position: absolute;
  right: 0;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
}

.cell-icon {
  width: 32px;
  height: 32px;
  max-width: 32px;
  max-height: 32px;
  vertical-align: middle;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: transparent;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
}
</style>