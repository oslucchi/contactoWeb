<template>
  <div class="generic-data-viewer-root" :style="rootContainerStyle" @click="deselectRow">
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
<!--
        <button v-if="featuresEnabled[3]" @click.stop="searchElements">
          <img src="@/assets/icons/search.png" alt="Search" class="icon" />
        </button>
-->
                <!-- right aligned span -->
        <span v-if="showTitle" class="action-right">{{ showTitle }}</span>
      </div>

      <!-- table container: use tableHeight prop for an explicit container height -->
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
                  <span v-if="sortColumn === col.colName" class="sort-arrow">{{ sortDirection === 'asc' ? '▲' :
                    '▼'}}</span>
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
                    @click.stop="selectedRowId === getRowIdFromData(item, rowIdx) ? selectCell(item, rowIdx, col.colName) : selectRow(item, rowIdx)"                >
                  <div 
                    v-if="item[col.colName] !== undefined"
                    style="width: 100%; display: flex; align-items: center; font-family: inherit; font-size: inherit; font-weight: inherit; min-width:0; overflow:hidden;"
                  >
                    {{ 
                      /* we want to allow the ability of injecting
                       * custom html content into the cell.
                       * in order to avoid repeated un-needed calls to DOMPurify
                       * we limit the cells to be considered for editing only when
                       * the cell has a renderLayout defined
                       */
                    }}
                    <div 
                        v-if="col.renderLayout && 
                              String(item[col.renderLayout]).trim() !== '' && 
                              hasValue(item, col)"
                        class="cell-content"
                        v-ellipsis="() => getCellTitle(item, col)"
                        style="flex: 1 1 auto; min-width: 0;"
                    >
                      <div v-if="selectedCell === col.colName && featuresEnabled[4]">
                        <input class="table-input" v-model="item[col.colName]" style="width: 100%;" />
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
                        style="flex: 1 1 auto; min-width: 0;"
                    >
                      <span style="display:inline-block; vertical-align:middle; max-width:100%; box-sizing:border-box;">
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

const _ellipsisThunks = new WeakMap(); // store thunks for elements
let _ellipsisScheduled = false;        // debounce flag

function getClassByName(name) {
  if (!name) {
    return Object;
  }
  try {
    // require may return module or module.default depending on exports
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const mod = require(`@/types/${name}`);
    return (mod && mod.default) ? mod.default : mod;
  } catch (e) {
    console.error(`getClassByName: could not load class "${name}", returning Object fallback`, e);
    return Object;
  }
}

function applyEllipsis(el) {
  // ensure ellipsis css (idempotent)
  el.style.overflow = 'hidden';
  el.style.textOverflow = 'ellipsis';
  el.style.whiteSpace = 'nowrap';
  el.style.display = 'block';
  el.style.maxWidth = '100%';
  el.style.boxSizing = 'border-box';

  // measure overflow first (single read)
  const clientW = el.clientWidth;
  const scrollW = el.scrollWidth;
  const isOverflowing = scrollW > clientW;

  // toggle marker class so CSS can show the "..." only for overflowing cells
  if (isOverflowing) {
    el.classList.add('is-cropped');
  } else {
    el.classList.remove('is-cropped');
  }

  if (isOverflowing) {
    // compute title lazily only when needed (call thunk or use provided string)
    let titleText = '';
    try {
      const thunk = (typeof altOrGetter !== 'undefined') ? altOrGetter : _ellipsisThunks.get(el);
      if (typeof thunk === 'function') titleText = String(thunk() || '').trim();
      else titleText = (typeof thunk === 'string') ? thunk.trim() : (el.textContent || '').trim();
    } catch (e) {
      titleText = (el.textContent || '').trim();
    }
    if (titleText) el.setAttribute('title', titleText);
    else el.removeAttribute('title');
  } else {
    el.removeAttribute('title');
  }

}

export default {
  name: 'GenericDataViewer',
  components: { SearchByString },
  props: {
    page: { type: String, required: true },
    element: { type: String, required: true },
    user: { type: Number, required: true },
    filter: { type: Object, default: () => ({}) },
    featuresEnabled: { type: Array, default: () => [false, false, false, false, false] },
    editCellEnabled: { type: Boolean, default: false },
    tableHeight: { type: Number, required: true },
    containerWidth: { type: Number, required: true },
    preserveRightSpace: { type: Number, default: 0 },
    capWidth: { type: Number, default: 0 },
    listenEvents: { type: Array, default: () => [] },
    emitOnSelect: { type: [String, Array], default: null },
    // columnsToSearch: { type: Array, default: () => null },
    // searchPlaceholder: { type: String, default: null }

  },
  emits: ['rowSelected'],
  data() {
    return {
      tableConfig: { table: this.element, columns: [] },
      _itemsSource: [], // original unfiltered records
      items: [],

      columnsToSearch: [],
      searchPlaceholder: '',

      selectedRowId: null,
      selectedCell: null,
      showEditModal: false,
      // new report modal state
      showReportModal: false,
      reportDraft: '',

      selectedItem: null,
      sortColumn: null,
      sortDirection: null,
      tableRenderKey: 0,
      rowHeight: 20,
      localBodyHeight: 0,
      localTableWidth: 0,
      effectiveContainerWidth: 0,
      _externalListeners: [],

      _ellipsisScheduledFlag: false,
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

    if (module && module.hot) {
      module.hot.dispose(() => {
        // use the *same* references you registered
        window.removeEventListener('resize', this.calculateTableDimensions);
        if (this._externalListeners && this.$root && this.$root.$off) {
          this._externalListeners.forEach(({ evtName, handler }) => this.$root.$off(evtName, handler));
          this._externalListeners = [];
        }
      });
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.calculateTableDimensions);
    if (this._externalListeners && this._externalListeners.length && this.$root && this.$root.$off) {
      this._externalListeners.forEach(({ evtName, handler }) => {
        this.$root.$off(evtName, handler);
      });
      this._externalListeners = [];
    }
  },

  computed: {
    rootContainerStyle() {
      // Use fluid width but cap it so the viewer never exceeds its parent/cap.
      // const provided = (typeof this.containerWidth === 'number' && this.containerWidth > 0) ? this.containerWidth : Infinity;
      // const effective = (typeof this.effectiveContainerWidth === 'number' && this.effectiveContainerWidth > 0) ? this.effectiveContainerWidth : Infinity;
      // const cap = Math.min(provided, effective);
      // return { width: '100%', maxWidth: (isFinite(cap) ? cap + 'px' : 'none') };
      return { width: '100%' };
    },

    anyActionEnabled() { return this.featuresEnabled.some(f => f); },

    bodyHeight() { return this.localBodyHeight || (this.tableHeight - 28); },

    visibleColumns() {
      var cols = (this.tableConfig && Array.isArray(this.tableConfig.columns)) ? 
                      this.tableConfig.columns : [];
      let visibleColumns =  cols.filter(col => (col.visible === 1 || col.visible === '1' || col.visible === true || col.visible === 'Y' || col.visible === 'y'))
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      console.log("Visible Columns:", visibleColumns);
      return visibleColumns;
    },

    sortedItems() {
      if (!this.sortColumn || !this.sortDirection) return this.items;
      let sorted = [...this.items];
      sorted.sort((a, b) => {
        let valA = a[this.sortColumn] || '';
        let valB = b[this.sortColumn] || '';
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted;
    },
    itemIdField() {
      if (!this.tableConfig || !this.tableConfig.columns) return null;
      let idCol = this.tableConfig.columns.find(col => col.colName && col.colName.toLowerCase().startsWith('id'));
      if (!idCol) idCol = this.tableConfig.columns.find(col => col.position === 0);
      return idCol ? idCol.colName : null;
    },
    showTitle() {
      console.log("showTable is ", this.tableConfig.showTitle);
      if (!this.tableConfig || !this.tableConfig.showTitle) return '';
        return this.tableConfig.showTitle;
    },
  },

  async created() {
    try {
      const configRes = await axios.get(`${API_BASE_URL}/utility/browserData`, {
        params: { page: this.page, element: this.element, user: this.user }
      });
      const cfg = configRes && configRes.data ? configRes.data : null;
      if (!cfg || (cfg.columns && !Array.isArray(cfg.columns))) {
        console.warn('browserData returned invalid config:', cfg);
        this.tableConfig = { table: this.element, columns: [], cliClassName: null, restModuleName: null, dataCollectMethod: null };
        return;
      }
      this.tableConfig = new ColConfigHeader(cfg);
      if (!this.tableConfig.cliClassName || !this.tableConfig.restModuleName || !this.tableConfig.dataCollectMethod) {
        console.warn('Missing required config fields:', this.tableConfig);
        return;
      }

      const ClassType = getClassByName(this.tableConfig.cliClassName);
      const queryParms = { ...(this.filter || {}), rawData: true };
      const dataRes = await axios.get(
                        `${API_BASE_URL}/${this.tableConfig.restModuleName}/${this.tableConfig.dataCollectMethod}`, 
                        { params: queryParms }
                      );

      this.items = Array.isArray(dataRes.data) ? dataRes.data.map(obj => {
        const item = obj instanceof ClassType ? obj : new ClassType(obj);
        (this.tableConfig.columns || []).forEach(col => {
          if (!(col.colName in item))
          {
            item[col.colName] = '';
          }
        });
        return item;
      }) : [];

      // keep an immutable copy of the loaded dataset so we can filter locally
      this._itemsSource = Array.isArray(this.items) ? this.items.slice() : [];
      this.searchPlaceholder = '';
      this.columnsToSearch = [];
      const cols = Array.isArray(this.tableConfig.columns) ? this.tableConfig.columns : [];
      if (!cols.length) {
        console.warn('GenericDataViewer: no columns array found on tableConfig', this.tableConfig);
      }

      let sep = "";
      cols.forEach( col => {
          const useInSearch = col && col.useInSearch;
          const name = col && col.showName;
          const colName = col && col.colName;
          console.log(col);
          if (useInSearch && name && colName) {
            this.searchPlaceholder += sep + String(name).substring(0, 5);
            this.columnsToSearch.push(col.colName);
            sep = ', ';
          }
        }
      )
      console.log("Search Placeholder:", this.searchPlaceholder);
      console.log("Columns to Search:", this.columnsToSearch);
      console.log("Table Config:", this.tableConfig);

      console.log()
      this.$nextTick(() => {
        this.calculateTableDimensions();
        if (typeof this.refreshEllipsis === 'function') this.refreshEllipsis();
      });
    } catch (err) {
      console.error('created() failed:', err);
      this.tableConfig = this.tableConfig || { table: this.element, columns: [] };
      this.items = [];
    }
  },

  directives: {
    // Lightweight directive: mark elements and store thunk; actual work is done by refreshEllipsis()
    ellipsis: {
      inserted(el, binding) {
        if (_ellipsisThunks === undefined) return;
        // mark element for later processing
        el.setAttribute('data-ellipsis', '1');
        if (binding && binding.value) {
          if (typeof binding.value === 'function') {
             _ellipsisThunks.set(el, binding.value);
          }
          else {
            _ellipsisThunks.set(el, () => binding.value);
          }
        } 
        else {
          _ellipsisThunks.set(el, null);
        }
      },
      componentUpdated(el, binding) {
        if (_ellipsisThunks === undefined) return;
        // update stored thunk if it changes; keep DOM work out of render path
        if (binding && binding.value) {
          if (typeof binding.value === 'function') {
            _ellipsisThunks.set(el, binding.value);
          }
          else {
            _ellipsisThunks.set(el, () => binding.value);
          }
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
    // adjust all cell textareas so they grow to fit content (up to CSS max-height)
    adjustCellTextareas() {
      this.$nextTick(() => {
        if (!this.$el) return;
        const nodes = Array.from(this.$el.querySelectorAll('textarea.cell-textarea'));
        nodes.forEach(t => {
          try {
            // reset to measure content
            t.style.height = 'auto';
            // compute maxHeight (computed style may be like "20rem" or "400px")
            const cs = window.getComputedStyle(t);
            const maxHRaw = cs.maxHeight || '';
            let maxH = Number.POSITIVE_INFINITY;
            if (maxHRaw && maxHRaw !== 'none') {
              // try parse px first
              if (maxHRaw.endsWith('px')) maxH = parseFloat(maxHRaw);
              else if (maxHRaw.endsWith('rem')) maxH = parseFloat(maxHRaw) * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
              else if (maxHRaw.endsWith('em')) maxH = parseFloat(maxHRaw) * (parseFloat(cs.fontSize) || 16);
            }
            const needed = t.scrollHeight;
            const target = Math.min(needed, isFinite(maxH) ? maxH : needed);
            t.style.height = (target > 0 ? target : Math.max(40, needed)) + 'px';
            t.style.overflowY = (needed > target) ? 'auto' : 'hidden';
          } catch (e) {
            // ignore per-node issues
          }
        });
      });
    },

    onSearchInput(value) {
      const v = value == null ? '' : String(value).trim();
      // if less than 3 chars, restore full dataset
      if (v.length < 3) {
        this.items = Array.isArray(this._itemsSource) ? this._itemsSource.slice() : (Array.isArray(this.items) ? this.items : []);
        return;
      }

      const term = v.toLowerCase();
      const cols = this.visibleColumns || [];

      // filter _itemsSource: include item if any visible column contains the substring (OR)
      this.items = (this._itemsSource || []).filter(item => {
        for (let i = 0; i < cols.length; i++) {
          const col = cols[i];
          if (!col || !col.colName || !this.columnsToSearch.includes(col.colName)) continue;
          const raw = item ? item[col.colName] : null;
          if (raw == null) continue;
          const s = String(raw).toLowerCase();
          if (s.indexOf(term) !== -1) return true;
        }
        return false;
      });
    },

    setRef(mainRef, rowIdx, colIdx) {
      return `${mainRef}-${rowIdx}-${colIdx}`;
    },

    // parse a CSS string like "color:red;font-weight:bold" => { color: 'red', 'font-weight': 'bold' }
    parseStyleString(cssText) {
      if (!cssText || typeof cssText !== 'string') return {};
      const out = {};
      cssText.split(';').forEach(pair => {
        const idx = pair.indexOf(':');
        if (idx > -1) {
          const k = pair.slice(0, idx).trim();
          const v = pair.slice(idx + 1).trim();
          if (k) out[k] = v;
        }
      });
      return out;
    },

    // build the inline style object for a cell: base flex rules + optional per-cell css
    mergeCellStyle(item, col) {
      // base ensures the element remains the flex child and measurable for ellipsis
      const base = { flex: '1 1 auto', 'min-width': '0' };
      if (!col || !col.style) return base;
      // obtain css text from item field or column static config
      let cssText = '';
      if (item && (col.style in item)) {
        cssText = item[col.style] == null ? '' : String(item[col.style]);
      }

      if (!cssText) {
        return '';
      }
      else
      {
        return cssText.endsWith(';') ? cssText : cssText + ';';
      }
    },

    // schedule a single batched pass to compute ellipsis/title for marked cells
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
        // only select marked elements
        const nodes = this.$el.querySelectorAll('[data-ellipsis="1"]');
        if (!nodes || !nodes.length) return;
        // batch application: avoid layout thrash by doing minimal per-element reads/writes
        nodes.forEach(el => {
          try {
            const thunk = _ellipsisThunks.get(el);
            applyEllipsis(el, thunk);
          } catch (e) {
            // ignore per-element errors to keep loop robust
            // console.warn('applyEllipsis failed for node', e);
          }
          this.adjustCellTextareas();
        });
      });
    },
    
    // compute a friendly title for the cell: prefer the raw value used for rendering,
    // strip HTML if needed so tooltip is plain text
    getCellTitle(item, col) {
      const name = this.getCellName(col);
      let v = name && item ? item[name] : '';
      if (v == null) v = '';
      // if value contains HTML (or renderLayout is HTML), strip tags for tooltip
      if (typeof v === 'string' && /<[^>]+>/.test(v)) {
        const tmp = document.createElement('div');
        tmp.innerHTML = v;
        return (tmp.textContent || tmp.innerText || '').trim();
      }
      // otherwise return plain string representation
      return String(v).trim();
    },

    getCellName(col) {
      // default: the column value lives under col.colName
      // if you want to store icon names in a different item field, set col.renderField = 'otherField' in your col config
      return (col && col.renderField) ? col.renderField : (col && col.colName) ? col.colName : null;
    },
    hasValue(item, col) {
      const name = this.getCellName(col);
      const v = name && item ? item[name] : undefined;
      return v !== null && v !== undefined && v !== '';
    },

    // normalize input to Date (accept Date object, ISO string, seconds or ms number)
    _toDate(value) {
      if (value == null || value === '') return null;
      if (value instanceof Date) return value;
      if (typeof value === 'number') {
        // if looks like seconds (10 digits) convert to ms
        return new Date(value < 1e12 ? value * 1000 : value);
      }
      const d = new Date(value);
      return isFinite(d) ? d : null;
    },

    // simple formatter supporting token "YY","YYYY","MM","DD","HH","mm","ss"
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
      // replace tokens (longer tokens first)
      return layout.replace(/YYYY|YY|MM|DD|HH|mm|ss/g, t => tokens[t] || t);
    },

    // basic number formatter: interpret format like "0.00#" -> min decimals = count of '0' after '.', use fixed decimals = count zeros
    formatNumber(value, layout = '0.00') {
      if (value == null || value === '') return '';
      const n = Number(value);
      if (!isFinite(n)) return String(value);
      const dotIdx = String(layout).indexOf('.');
      let minDecimals = 0;
      if (dotIdx >= 0) {
        const frac = layout.slice(dotIdx + 1);
        // count '0' as mandatory decimals
        minDecimals = (frac.match(/0/g) || []).length;
      }
      return n.toLocaleString(undefined, { minimumFractionDigits: minDecimals, maximumFractionDigits: Math.max(minDecimals, 6) });
    },

    // simple escapers
    escapeHtml(s) {
      if (s == null) return '';
      return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    },
    escapeAttr(s) {
      return this.escapeHtml(s).replace(/"/g, '&quot;');
    },

    // resolve an icon name to a usable src URL.
    // tries webpack `require` for common extensions so icons are bundled; falls back to public /assets path.
    iconSrcFor(name) {
      if (name == null) return '';
      const base = String(name).trim();
      if (!base) return '';
      const candidates = [base]; //, `${base}.png`, `${base}.svg`, `${base}.jpg`, `${base}.jpeg`, `${base}.gif`];
      for (let i = 0; i < candidates.length; i++) {
        try {
          // eslint-disable-next-line global-require, import/no-dynamic-require
          const r = require(`@/assets/icons/${candidates[i]}`);
          if (r) {
            return (typeof r === 'string') ? r : (r.default || r);
          }
        } catch (e) {
          // try next
        }
      }
      // fallback to public-served path (assumes /assets/icons/* is served)
      return `/assets/icons/${encodeURIComponent(base)}.png`;
    },
    // helper: cache key for a cell
    _cellCacheKey(item, col) {
      const id = this.getRowIdFromData(item, -1);
      const val = (item && col && (col.colName in item)) ? item[col.colName] : '';
      const layout = (col && col.renderLayout) ? String(col.renderLayout) : '';
      return `${id}::${col ? col.colName : ''}::${layout}::${String(val)}`;
    },

    // return safe HTML string for a cell (ICON/DATETIME/NUMBER/STRING)
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
          // use the icon name/value from the item and resolve to a real URL
          const iconName = item && col && (col.colName in item) ? String(item[col.colName] || '').trim() : '';
          if (iconName) {
            const resolved = this.iconSrcFor(iconName);
            const s = this.escapeAttr(resolved);
            const alt = this.escapeAttr(iconName);

            // parse optional size from format token, e.g. "ICON 24" 
            let h = 20;
            if (fmt) {
              const m = fmt.match(/^(\d+)(?:x(\d+))?/);
              if (m) { h = parseInt(m[1], 10) || 20; }
            }
            html = `<img class="cell-icon" 
                         style="width:100%;max-width:100%;height:${h}px;max-height:${h}px;object-fit:contain;"
                         src="${s}" alt="${alt}"/>`;
          } 
          else {
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
          // explicit "HTML" type: allow limited HTML but sanitize it
          html = String(raw || '');
          break;
        }
        case 'TEXT': {
          // Render full text inside a non-resizable readonly textarea so users can scroll.
          // We escape the content to avoid injecting HTML into the textarea.
          const content = this.escapeHtml(raw == null ? '' : String(raw));
          html = `<textarea class="cell-textarea" readonly aria-readonly="true" style="border: none; padding 12px; width: 99%">${content}</textarea>`;
          break;
        }
        default:
          html = this.escapeHtml(raw == null ? '' : String(raw));
      }

      // sanitize and return (allow only img and span with src/alt/class on img)
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['img', 'span', 'textarea'],
        ALLOWED_ATTR: ['src', 'alt', 'class', 'style']
      });
    },

    calculateTableDimensions() {
      // var parentWidth = (this.$el && this.$el.parentElement && this.$el.parentElement.offsetWidth) || 0;
      // var screenW = window.innerWidth || document.documentElement.clientWidth || parentWidth || 0;
      // var specified;
      // if (this.containerWidth && typeof this.containerWidth === 'number' && this.containerWidth > 0) {
      //   specified = this.containerWidth;
      // } else {
      //   specified = (typeof this.capWidth === 'number' && this.capWidth > 0) ? this.capWidth : (parentWidth || screenW);
      // }

      // Measure parent width and use it only for internal sizing calculations.
      const parentEl = this.$el && this.$el.parentElement ? this.$el.parentElement : null;
      const parentWidth = parentEl ? parentEl.clientWidth || parentEl.offsetWidth : (window.innerWidth || document.documentElement.clientWidth || 0);
      // prefer explicit containerWidth prop when provided, otherwise use measured parent width
      const specified = (typeof this.containerWidth === 'number' && this.containerWidth > 0) ? this.containerWidth : parentWidth;

      // var headerH = 28;
      // if (this.$refs && this.$refs.headerRef && this.$refs.headerRef.offsetHeight) headerH = this.$refs.headerRef.offsetHeight;
      let headerH = 28;
      if (this.$refs && this.$refs.headerRef && this.$refs.headerRef.offsetHeight) headerH = this.$refs.headerRef.offsetHeight;

      var containerPadV = 2 + 0;
      var scrollbarReserve = 4;

      this.localBodyHeight = Math.max(0, this.tableHeight - headerH - containerPadV - scrollbarReserve);

      // var preserve = (typeof this.containerWidth === 'number' && this.containerWidth > 0) ? 0 : Math.max(0, this.preserveRightSpace || 0);
      // var minOfTwo = Math.min(specified, screenW);
      // this.effectiveContainerWidth = Math.max(0, minOfTwo - preserve);
      // preserve right gutter only when viewer is not constrained by an explicit containerWidth prop
      const preserve = (typeof this.containerWidth === 'number' && this.containerWidth > 0) ? 0 : Math.max(0, this.preserveRightSpace || 0);
      // effectiveContainerWidth is for internal calculations only (not applied to root styling)
      this.effectiveContainerWidth = Math.max(0, Math.round(Math.max(0, specified - preserve)));

      // total width defined by DB column widths (do NOT force expand to parent)
      var totalColWidth = this.visibleColumns.reduce(function (sum, col) { 
                                  return sum + (Number(col.width) || 120); }, 0
                                );

      // ensure a sane minimum but prefer totalColWidth so columns keep DB sizes
      this.localTableWidth = Math.max((totalColWidth || 0), 50);

      this.refreshEllipsis();

      this.$nextTick(() => {
        const body = this.$refs && this.$refs.tbodyScroll;
        const header = this.$refs && this.$refs.headerRef;
        if (body && header) {
          const sb = body.offsetWidth - body.clientWidth;
          header.style.paddingRight = sb > 0 ? sb + 'px' : '0px';
          // ensure the viewer reserves the same gutter so its right border sits outside the scrollbar
          if (this.$refs.masterdataContent && typeof this.$refs.masterdataContent.style.setProperty === 'function') {
            this.$refs.masterdataContent.style.setProperty('padding-right', sb > 0 ? sb + 'px' : '0px');
          }
        }
      });
    },

    // add three-state column sorting: asc -> desc -> natural (off)
    handleSort(colName) {
      if (!colName) return;
      if (this.sortColumn !== colName) {
        this.sortColumn = colName;
        this.sortDirection = 'asc';
      } else if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else {
        // third click -> return to natural ordering
        this.sortColumn = null;
        this.sortDirection = null;
      }
      // force a re-render and notify parent if needed
      // this.tableRenderKey++;
      this.$emit('sorted', { column: this.sortColumn, direction: this.sortDirection });
    },

    getRowIdFromData(item, rowIdx) {
      if (!this.tableConfig || !this.tableConfig.columns) return rowIdx;
      const idValue = item && this.itemIdField ? item[this.itemIdField] : undefined;
      // treat 0 and empty-string as valid IDs; only fallback when id is null/undefined
      return (idValue !== null && idValue !== undefined) ? idValue : rowIdx;
    },

    emitStructuredSelection(item, rowIdx) {
      const id = this.getRowIdFromData(item, rowIdx);
      const elementName = this.element ? this.element : (this.tableConfig && this.tableConfig.element ? this.tableConfig.element : null);
      const payload = { element: elementName, idField: this.itemIdField || null, id, item };
      this.$emit('rowSelected', payload);
    },

    selectRow(item, rowIdx) {
      try {
        this.selectedRowId = this.getRowIdFromData(item, rowIdx);
        this.selectedItem = item;
      } catch (error) {
        this.selectedRowId = null;
        this.selectedItem = item || null;
      }
      this.selectedCell = null;
      this.tableRenderKey++;
      this.enableCellEdit = false;
      this.emitStructuredSelection(item, rowIdx);
    },

    selectCell(item, rowIdx, colName) {
      this.selectedCell = colName;
      this.selectedItem = item;
      this.tableRenderKey++;
      // Note: per requirement, do NOT emit rowSelected from selectCell
    },

    refreshEllipsis() {
      const runner = (cb) => {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(cb, { timeout: 200 });
        } else {
          window.requestAnimationFrame(cb);
        }
      };
      runner(() => {
        if (!this.$el) return;
        const nodes = this.$el.querySelectorAll('.cell-content');
        if (nodes && nodes.length) nodes.forEach(applyEllipsis);
        // also adjust any TEXT textareas after layout settles
        this.adjustCellTextareas();

      });
    },

    syncHeaderScroll(e) {
      const scrollLeft = e.target.scrollLeft;
      const header = this.$refs && this.$refs.headerRef;
      if (header) {
        const headerTable = header.querySelector('table');
        if (headerTable) headerTable.style.transform = `translateX(${-scrollLeft}px)`;
      }
      const sb = e.target.offsetWidth - e.target.clientWidth;
      if (header) header.style.paddingRight = sb > 0 ? sb + 'px' : '0px';
    },

    startResize(evt, col, index) {
      if (!col) return;
      const startX = evt.pageX;
      const startWidth = Number(col.width) || 120;
      const minW = 40;
      const maxW = 1200;
      const body = document.body;
      const oldCursor = body.style.cursor;
      body.style.cursor = 'col-resize';

      const onMove = (e) => {
        const delta = e.pageX - startX;
        let next = Math.max(minW, Math.min(maxW, startWidth + delta));
        // this.$refs.tbodyScroll.width;
        col.width = Math.round(next);
        if (this.$refs && this.$refs.tbodyScroll) {
          const sb = this.$refs.tbodyScroll.offsetWidth - this.$refs.tbodyScroll.clientWidth;
          if (this.$refs.headerRef) this.$refs.headerRef.style.paddingRight = sb > 0 ? sb + 'px' : '0px';
        }
        this.refreshEllipsis();
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        body.style.cursor = oldCursor || '';
        this.$nextTick(() => { this.calculateTableDimensions(); this.refreshEllipsis(); });
        // persist updated column config (saveColConfig implemented below)
        console.log('mouse up ')
        if (typeof this.saveColConfig === 'function') this.saveColConfig({ ...col });
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },

    // persist column config: try server, fallback to localStorage and emit event
    async saveColConfig(col) {
      try {
        // compute changed fields by comparing with persisted per-user config (if any)
        const key = `colConfig:${this.element}:user:${this.user || '0'}`;
        const existingRaw = localStorage.getItem(key);
        const existing = existingRaw ? JSON.parse(existingRaw || '{}') : {};
        const prev = existing[col.colName] || {};

        var changedAttributes = "";
        var sep = "";
        Object.keys(col).forEach(k => {
          // compare as strings to avoid type differences
          const a = prev[k] === undefined ? undefined : String(prev[k]);
          const b = col[k] === undefined ? undefined : String(col[k]);
          console.log(`checking ${a} vs ${b}`);
          if (a !== b) {
            console.log(`changedAttributes ${k}`);
            changedAttributes += sep + k;
            sep = ",";
            console.log(`changedAttributes ${changedAttributes}`);
          }
        });

        const payload = {
          column: col,
          changedAttributes: changedAttributes // array of attribute names that actually changed
        };
        console.log('invoking put');
        await axios.put(`${API_BASE_URL}/utility/colConfigDetail/${col.idColConfigDetail || 0}`, payload);

        // persist locally as well (update existing snapshot)
        existing[col.colName] = { ...col, savedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(existing));

        this.$emit('colConfigSaved', { column: col, changedFields, persisted: 'remote' });
        return;
      } catch (err) {
        // fallback: localStorage per-user & table (also emit changedFields)
        try {
          const key = `colConfig:${this.element}:user:${this.user || '0'}`;
          const existingRaw = localStorage.getItem(key);
          const existing = existingRaw ? JSON.parse(existingRaw || '{}') : {};
          existing[col.colName] = { width: col.width, savedAt: Date.now(), ...col };
          localStorage.setItem(key, JSON.stringify(existing));

          // compute changedFields for emit (best-effort)
          const changedFields = Object.keys(col);

          this.$emit('colConfigSaved', { column: col, changedFields, persisted: 'local' });
          return;
        } catch (e) {
          console.warn('saveColConfig fallback failed', e);
        }
      }
    },

    async reloadData() {
      console.log('GenericDataViewer.reloadData called', { page: this.page, element: this.element, filter: this.filter });

      if (!this.tableConfig.cliClassName || !this.tableConfig.restModuleName || !this.tableConfig.dataCollectMethod) {
        console.warn('Missing required config fields:', this.tableConfig);
        this.items = [];
        return;
      }

      const ClassType = (this.tableConfig && this.tableConfig.cliClassName) ? 
                              getClassByName(this.tableConfig.cliClassName) : Object;
      const queryParms = { ...(this.filter || {}), rawData: true };
      const url = `${API_BASE_URL}/${this.tableConfig.restModuleName}/${this.tableConfig.dataCollectMethod}`;
      try {
        const dataRes = await axios.get(`${API_BASE_URL}/${this.tableConfig.restModuleName}/${this.tableConfig.dataCollectMethod}`, { params: this.filter });
        this.items = Array.isArray(dataRes.data) ? dataRes.data.map(obj => {
          const item = obj instanceof ClassType ? obj : new ClassType(obj);
          (this.tableConfig.columns || []).forEach(col => { if (!(col.colName in item)) item[col.colName] = ''; });
          return item;
        }) : [];
        // refresh local source copy for future filtering
        this._itemsSource = Array.isArray(this.items) ? this.items.slice() : [];

        this.selectedRowId = null;
        this.selectedCell = null;
        this.showEditModal = false;
      }
      catch (err) {
        console.error('Failed loading data', { url, params: queryParms, status: err && err.response && err.response.status, message: err && err.message });
        if (err && err.response && err.response.status === 404) {
          // server says endpoint not found — treat as no-data and continue
          this.items = [];
        } else {
          // other errors: also avoid throwing to keep UI usable
          this.items = [];
        }
      }
      this.$nextTick(() => {
        this.calculateTableDimensions();
        if (typeof this.refreshEllipsis === 'function') this.refreshEllipsis();
        // ensure TEXT area heights are adjusted after reload/render
        this.adjustCellTextareas();
      });

      if (typeof this.loadData === 'function') {
        try {
          this.loadData();
        } catch (e) {
          console.warn('loadData failed', e);
        }
      }
    },

    // CRUD helpers (save/delete/add/search/deselect) unchanged...
    saveItem(item) {
      axios.put(`${API_BASE_URL}/${this.tableConfig.restModuleName}/${item[this.itemIdField]}`, item).catch(() => alert('Error saving item'));
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
            this.selectedCell = null;
            this.selectedItem = null;
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
      this.selectedItem = res.data;
    },
    searchElements() {
      const searchTerm = prompt('Enter search term:');
      if (searchTerm !== null) {
        this.filter = { ...this.filter, searchFor: searchTerm };
        this.reloadData();
      }
    },
    deselectRow() { this.selectedRowId = null; this.selectedCell = null; this.selectedItem = null; },
  },

  watch: {
    tableHeight(newVal) {
      this.$nextTick(() => { if (typeof this.calculateTableDimensions === 'function') this.calculateTableDimensions(); });
    },
    filter: {
      handler(newFilter) { if (typeof this.reloadData === 'function') this.reloadData(); },
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
/* this pushes the span to the far right while keeping buttons on the left */
.action-icons .action-right {
  margin-left: auto;
  /* optional styling */
  font-size: 1.5rem;
  font-style: 'italic';
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
.masterdata-table-container,
.masterdata-table-header,
.masterdata-tbody-scroll {
  box-sizing: border-box;
}

/* Outer layout */
.generic-data-viewer-root,
.masterdata-content {
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  min-width: 0;
  /* allow flex parent to constrain width */
  ;
}

.generic-data-viewer-root {
  height: 100%;
  /* inherit the section's px height */
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* allow children to shrink inside flex */
}

.masterdata-content {
  position: relative;
  /* ensure z-index and shadow render correctly */
  z-index: 2;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.6);
  background-clip: padding-box;
  /* avoid border being overlapped by children */
}

/* ensure the scrolling element inside the viewer shows a native scrollbar */
.masterdata-scroll,
.masterdata-table-container,
.masterdata-inner {
  min-height: 0;
  /* avoid flex overflow issues */
  overflow-y: auto;
  /* show vertical scrollbar when needed */
  -webkit-overflow-scrolling: touch;
}

/* if the parent section had a border that could overlap, keep the viewer above it */
.generic-data-viewer-root {
  /* adjust the actual root class name if different */
  position: relative;
  z-index: 2;
}

/* the scrolling area must contain wide tables and provide its own horizontal scrollbar */
.masterdata-tbody-scroll,
.masterdata-table-container,
.masterdata-scroll {
  min-width: 0;
  /* allow container to be sized by parent */
  overflow-x: auto;
  /* horizontal scroll when table wider than container */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable both-edges;
}

.masterdata-table-container {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 2px;
  overflow: hidden;
  min-width: 0;
  /* prevent flex shrink */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Header stays visible; will follow horizontally via syncHeaderScroll */
.masterdata-table-header {
  flex: 0 0 auto;
  width: 100%;
  overflow: hidden;
  min-width: 0;
  will-change: transform;
  display: flex;
  justify-content: center;
}

/* tbody is the scroll region for both axes */
.masterdata-tbody-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable both-edges;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* Table sizing: fill container when narrow, grow when wide (no shrink) */
.masterdata-table {
  width: auto;
  /* do not force 100% stretch; minWidth is controlled inline */
  min-width: 0;
  table-layout: fixed;
  box-sizing: border-box;
  border-collapse: collapse;
  /* collapsed borders so cells share borders */
}

/* Cell styling */
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

.masterdata-table td div[title]:hover::after {
  content: attr(title);
  position: absolute;
  background: #222;
  color: #fff;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.85em;
  white-space: nowrap;
  transform: translateY(-120%);
  z-index: 10;
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

.masterdata-table .row-selected td,
tr.row-selected td {
  background: #DCF8C6 !important;
}

/* NEW: ensure textarea expands to full cell width and allows wrapping (overrides ellipsis parent) */
.cell-content textarea.cell-textarea,
.masterdata-table td .cell-textarea {
  display: block !important;
  width: 100% !important;
  min-width: 100% !important;    /* allow flex to shrink/expand correctly */
  max-width: 100% !important;
  white-space: pre-wrap !important; /* allow multiline text */
  word-break: break-word;
  overflow-y: auto;           /* vertical scrollbar when needed */
  box-sizing: border-box;
  font-family:Verdana, Geneva, Tahoma, sans-serif;
}

.cell-content {
  /* Ellipsis mechanics */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* Flex-shrink essentials: let flex sizing control the used width */
  flex: 1 1 0;
  width: 0;
  /* <-- critical: without this, the node keeps content width */
  min-width: 0;
  /* allow shrinking below content size */
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
}

.td-editable {
  border: 2px solid #1900fd !important;
}

.table-input {
  width: 100%;
  height: 14px;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  background: inherit !important;
  color: inherit;
  border: none;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  vertical-align: middle;
  outline: none;
}

.table-input:focus {
  background: #e6f0ff;
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

.cell-textarea {
  width: 100%;
  box-sizing: border-box;
  resize: none !important;
  overflow: auto;
  min-height: 4rem;      /* reasonable default height */
  max-height: 20rem;     /* avoid excessive growth */
  padding: 6px;
  border: 0; /* keep cell border only from table */
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.2;
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
