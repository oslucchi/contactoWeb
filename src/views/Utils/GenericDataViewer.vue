<template>
    <div class="masterdata-bg" :style="rootContainerStyle" @click="deselectRow">
        <div class="masterdata-content">
            <!-- Action bar -->
            <div v-if="anyActionEnabled" class="action-icons">
                <button v-if="featuresEnabled[0]" :disabled="selectedRowId === null" @click.stop="openEditModal">
                    <img src="@/assets/icons/pencil.png" alt="Edit" class="icon" />
                </button>
                <button v-if="featuresEnabled[1]" :disabled="selectedRowId === null" @click.stop="deleteSelectedRow">
                    <img src="@/assets/icons/recycle-bin.png" alt="Delete" class="icon" />
                </button>
                <button v-if="featuresEnabled[2]" @click.stop="addNewItem">
                    <img src="@/assets/icons/add.png" alt="Add" class="icon" />
                </button>
                <button v-if="featuresEnabled[3]" @click.stop="searchElements">
                    <img src="@/assets/icons/search.png" alt="Search" class="icon" />
                </button>
            </div>

            <div class="masterdata-table-container" :style="{ height: tableHeight + 'px', padding: '2px 2px 0 2px' }">
                <div class="masterdata-table-header" ref="headerRef">
                    <table class="masterdata-table">
                        <colgroup>
                            <col v-for="col in visibleColumns" :key="col.idColConfigDetail"
                                :style="{ width: (col.width || 120) + 'px' }" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th v-for="col in visibleColumns" :key="col.idColConfigDetail"
                                    @click="col.useForSort && handleSort(col.colName)">
                                    {{ col.showName }}
                                    <span v-if="sortColumn === col.colName" class="sort-arrow">
                                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                                    </span>
                                    <span class="col-resizer" @mousedown.stop.prevent="startResize($event, col, i)"
                                        title="Resize column">
                                    </span>
                                </th>
                            </tr>
                        </thead>
                    </table>
                </div>
                <div class="masterdata-tbody-scroll" ref="tbodyScroll" @scroll="syncHeaderScroll"
                    :style="{ height: bodyHeight + 'px' }">
                    <table class="masterdata-table">
                        <colgroup>
                            <col v-for="col in visibleColumns" :key="col.idColConfigDetail"
                                :style="{ width: (col.width || 120) + 'px' }" />
                        </colgroup>
                        <tbody>
                            <tr v-for="(item, rowIdx) in sortedItems" :key="getRowIdFromData(item, rowIdx)"
                                :class="{ 'row-selected': selectedRowId === getRowIdFromData(item, rowIdx) }">
                                <td v-for="col in visibleColumns" :key="col.idColConfigDetail"
                                    :class="{ 'td-editable': selectedRowId === getRowIdFromData(item, rowIdx) && selectedCell === col.colName && featuresEnabled[4] }"
                                    @click.stop="selectedRowId === getRowIdFromData(item, rowIdx) ? selectCell(item, rowIdx, col.colName) : selectRow(item, rowIdx)">
                                    <div v-if="item[col.colName] !== undefined"
                                        style="width: 100%; display: flex; align-items: center; font-family: inherit; font-size: inherit; font-weight: inherit; min-width:0; overflow:hidden;">
                                        <div v-if="selectedCell === col.colName && featuresEnabled[4]">
                                            <input class="table-input" v-model="item[col.colName]"
                                                style="width: 100%;" />
                                        </div>
                                        <div v-else class="cell-content" v-ellipsis>
                                            {{ item[col.colName] !== undefined ? item[col.colName] :
                                            JSON.stringify(item) }}
                                        </div>
                                    </div>
                                    <div v-else>&nbsp;</div>
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
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import ColConfigHeader from '@/types/ColConfigHeader';

function getClassByName(name) {
    return require(`@/types/${name}`).default;
}

function applyEllipsis(el) {
    console.log('applyEllipsis called on:', el);
    // Enforce truncation styles (without relying on inline template styles)
    el.style.overflow = 'hidden';
    el.style.textOverflow = 'ellipsis';
    el.style.whiteSpace = 'nowrap';
    el.style.display = 'block';
    el.style.maxWidth = '100%';
    el.style.boxSizing = 'border-box';

    // Only show tooltip when content is actually truncated
    // Note: must run after element has a final width
    if (el.scrollWidth > el.clientWidth) {
        // Use textContent to avoid duplicating HTML; trim to keep it clean
        el.setAttribute('title', (el.textContent || '').trim());
    } else {
        el.removeAttribute('title');
    }
}

export default {
    name: 'GenericDataViewer',
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
        capWidth: { type: Number, default: 0 }, // 0 = ignore; >0 = hard cap in px
    },
    emits: ['rowSelected'],
    data() {
        return {
            tableConfig: { table: this.element }, // it was null before
            items: [],
            selectedRowId: null,
            selectedCell: null,
            showEditModal: false,
            selectedItem: null,
            sortColumn: null,
            sortDirection: null,
            tableRenderKey: 0,
            rowHeight: 20,
            localBodyHeight: 0,
            localTableWidth: 0,
            effectiveContainerWidth: 0,
        };
    },

    mounted() {
        // Optionally, add resize event listener to recalculate sizes
        window.addEventListener('resize', this.calculateTableDimensions);
        this.calculateTableDimensions();
        console.log('Mounted with containerWidth:', this.containerWidth);
    },

    computed: {
        rootContainerStyle() {
            // Keep it within the computed max width; width:100% ensures it fills up to that cap
            return {
                maxWidth: this.effectiveContainerWidth + 'px',
                width: '100%',
            };
        },
        anyActionEnabled() {
            return this.featuresEnabled.some(f => f);
        },
        paddedItems() {
            const rowsToShow = 10; // Or calculate based on container/table height
            const items = this.sortedItems.slice(0, rowsToShow);
            while (items.length < rowsToShow) {
                items.push({});
            }
            return items;
        },
        // Total width of columns (used only for logic if needed)
        tableWidth() {
            if (this.localTableWidth) return this.localTableWidth;
            // fallback: compute dynamically if needed
            if (!this.visibleColumns.length) return 0;
            return this.visibleColumns.reduce((sum, col) => sum + (col.width || 120), 0);
        },
        // Body height = full tableHeight minus an estimated header block
        bodyHeight() {
            return this.localBodyHeight || (this.tableHeight - 28);
        },
        visibleColumns() {
            var cols = (this.tableConfig && Array.isArray(this.tableConfig.columns)) ?
                this.tableConfig.columns
                :
                [];
            if (!this.tableConfig) return [];
            return cols
                .filter(col => (col.visible === 1 ||
                    col.visible === '1' ||
                    col.visible === true ||
                    col.visible === 'Y' ||
                    col.visible === 'y'))
                .sort((a, b) => (a.position || 0) - (b.position || 0));
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
            if (!idCol) {
                idCol = this.tableConfig.columns.find(col => col.position === 0);
            }
            return idCol ? idCol.colName : null;
        },
    },
    async created() {
        try {
            const configRes = await axios.get(`${API_BASE_URL}/utility/browserData`, {
                params: { page: this.page, element: this.element, user: this.user }
            });

            const cfg = configRes && configRes.data ? configRes.data : null;
            if (!cfg || (cfg.columns && !Array.isArray(cfg.columns))) {
                // invalid or null config from backend -> keep component safe and visible
                console.warn('browserData returned invalid config:', cfg);
                this.tableConfig = { table: this.element, columns: [], cliClassName: null, restModuleName: null, dataCollectMethod: null };
                // optionally skip data fetch since there are no columns to render
                return;
            }

            this.tableConfig = new ColConfigHeader(cfg);

            // guard the rest too, since subsequent lines depend on these fields
            if (!this.tableConfig.cliClassName || !this.tableConfig.restModuleName || !this.tableConfig.dataCollectMethod) {
                console.warn('Missing required config fields:', this.tableConfig);
                return;
            }

            const ClassType = getClassByName(this.tableConfig.cliClassName);
            const dataRes = await axios.get(
                `${API_BASE_URL}/${this.tableConfig.restModuleName}/${this.tableConfig.dataCollectMethod}`,
                { params: this.filter }
            );

            this.items = Array.isArray(dataRes.data) ? dataRes.data.map(obj => {
                const item = obj instanceof ClassType ? obj : new ClassType(obj);
                (this.tableConfig.columns || []).forEach(col => {
                    if (!(col.colName in item)) item[col.colName] = '';
                });

                this.$nextTick(() => {
                    this.calculateTableDimensions();
                });

                return item;
            }) : [];

        } catch (err) {
            console.error('created() failed:', err);
            // keep the component alive with a safe default
            this.tableConfig = this.tableConfig || { table: this.element, columns: [] };
            this.items = [];
        }
    },
    directives: {
        ellipsis: {
            inserted(el) { applyEllipsis(el); },
            componentUpdated(el) { applyEllipsis(el); }
        }
    },
    methods: {
        refreshEllipsis() {
            this.$nextTick(() => {
                const nodes = this.$el && this.$el.querySelectorAll('.cell-content');
                if (nodes) nodes.forEach(applyEllipsis);
            });
        },

        syncHeaderScroll(e) {
            const scrollLeft = e.target.scrollLeft;
            const header = this.$refs && this.$refs.headerRef;
            if (header) {
                const headerTable = header.querySelector('table');
                if (headerTable) {
                    headerTable.style.transform = `translateX(${-scrollLeft}px)`;
                }
            }
            // keep header and body content widths aligned when vertical scrollbar appears
            const sb = e.target.offsetWidth - e.target.clientWidth; // scrollbar width
            header.style.paddingRight = sb > 0 ? sb + 'px' : '0px';
        },
        calculateTableDimensions() {
            // Parent width (fallback to 0)
            var parentWidth = (this.$el && this.$el.parentElement && this.$el.parentElement.offsetWidth) || 0;

            // Compute screen and specified widths first (declare BEFORE use)
            var screenW = window.innerWidth || document.documentElement.clientWidth || parentWidth || 0;
            // Prefer a fixed capWidth if provided; otherwise fall back to containerWidth (which may be dynamic)
            var specified = (typeof this.capWidth === 'number' && this.capWidth > 0)
                ? this.capWidth
                : ((typeof this.containerWidth === 'number' && this.containerWidth > 0)
                    ? this.containerWidth
                    : (parentWidth || screenW));

            // Header height (fallback ~28)
            var headerH = 28;
            if (this.$refs && this.$refs.headerRef && this.$refs.headerRef.offsetHeight) {
                headerH = this.$refs.headerRef.offsetHeight;
            }

            // Container vertical padding: top 2px + bottom 0px (per your template)
            var containerPadV = 2 + 0;

            // Reserve a few px so last row isn't hidden under the horizontal scrollbar
            var scrollbarReserve = 4;

            // Visible tbody height
            this.localBodyHeight = Math.max(
                0,
                this.tableHeight - headerH - containerPadV - scrollbarReserve
            );

            // Effective max width for the outer container: min(specified, screen) - preserveRightSpace
            var preserve = Math.max(0, this.preserveRightSpace || 0);
            var minOfTwo = Math.min(specified, screenW);
            this.effectiveContainerWidth = Math.max(0, minOfTwo - preserve);

            // Table width: grow to fit columns, but not smaller than parent
            var totalColWidth = this.visibleColumns.reduce(function (sum, col) {
                return sum + (col.width || 120);
            }, 0);
            this.localTableWidth = Math.max(parentWidth, totalColWidth);

            this.refreshEllipsis();

            // ALSO set header padding once at layout time:
            this.$nextTick(() => {
                const body = this.$refs && this.$refs.tbodyScroll;
                const header = this.$refs && this.$refs.headerRef;
                if (body && header) {
                    const sb = body.offsetWidth - body.clientWidth;
                    header.style.paddingRight = sb > 0 ? sb + 'px' : '0px';
                }
            });
            // (Optional) debug:
            // console.log('calc dims -> parentWidth:', parentWidth, 'screenW:', screenW, 'specified:', specified, 'preserve:', preserve, 'effW:', this.effectiveContainerWidth, 'bodyH:', this.localBodyHeight);
        },

        getRowIdFromData(item, rowIdx) {
            if (!this.tableConfig || !this.tableConfig.columns) return rowIdx;
            const idValue = item[this.itemIdField];
            return idValue || rowIdx;
        },
        selectRow(item, rowIdx) {
            console.log('selectRow called:', item.idColConfigDetail, item.colName, rowIdx);
            this.selectedRowId = this.getRowIdFromData(item, rowIdx);
            this.selectedCell = null;
            this.selectedItem = item;
            this.tableRenderKey++;
            this.enableCellEdit = false;
            this.$emit('rowSelected', this.selectedItem);
        },
        enableCellEdit(rowIdx, colName) {
            // Only enable edit if the row is already selected
            if (this.selectedRowId === this.getRowIdFromData(this.sortedItems[rowIdx], rowIdx)) {
                this.selectedCell = colName;
            }
        },
        selectCell(item, rowIdx, colName) {
            console.log('selectCell called:',
                this.enableCellEdit, item.colName, rowIdx, colName);
            this.selectedCell = colName;
            this.selectedItem = item;

            if (this.tableConfig && this.tableConfig.element.toLowerCase() === 'company') {
                this.$emit('rowSelected', this.selectedItem);
            }
            this.tableRenderKey++;
        },
        getInputType(val) {
            if (typeof val === 'number') return 'number';
            if (typeof val === 'string' && val.includes('@')) return 'email';
            return 'text';
        },
        saveItem(item) {
            axios.put(`${API_BASE_URL}/${this.tableConfig.restModuleName}/${item[this.itemIdField]}`, item)
                .catch(() => alert('Error saving item'));
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
        deselectRow() {
            this.selectedRowId = null;
            this.selectedCell = null;
            this.selectedItem = null;
        },
        handleSort(column) {
            if (this.sortColumn !== column) {
                this.sortColumn = column;
                this.sortDirection = 'asc';
            } else if (this.sortDirection === 'asc') {
                this.sortDirection = 'desc';
            } else if (this.sortDirection === 'desc') {
                this.sortColumn = null;
                this.sortDirection = null;
            } else {
                this.sortDirection = 'asc';
            }
        },
        startResize(evt, col, index) {
            // guard
            if (!col) return;

            const startX = evt.pageX;
            const startWidth = Number(col.width) || 120;
            const minW = 40;            // hard minimum
            const maxW = 1200;          // sanity cap; adjust if needed

            // show resizing cursor globally
            const body = document.body;
            const oldCursor = body.style.cursor;
            body.style.cursor = 'col-resize';

            const onMove = (e) => {
                const delta = e.pageX - startX;
                let next = Math.max(minW, Math.min(maxW, startWidth + delta));
                // changing col.width updates BOTH colgroups because it's reactive
                col.width = Math.round(next);

                // keep layout + tooltips fresh while dragging
                if (this.$refs && this.$refs.tbodyScroll) {
                    const sb = this.$refs.tbodyScroll.offsetWidth - this.$refs.tbodyScroll.clientWidth;
                    if (this.$refs.headerRef) {
                        this.$refs.headerRef.style.paddingRight = sb > 0 ? sb + 'px' : '0px';
                    }
                }
                this.refreshEllipsis();
            };

            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                body.style.cursor = oldCursor || '';

                // reflow sizes once at the end
                this.$nextTick(() => {
                    this.calculateTableDimensions();
                    this.refreshEllipsis();
                });

                // persist the column width (optional; keep if you store per-user config)
                if (typeof this.saveColConfig === 'function') {
                    this.saveColConfig({ ...col });
                }
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },

        async saveColConfig(colConfigDetail) {
            // no-op if your backend isn’t ready; keep to match earlier versions
            try {
                await axios.put(
                    `${API_BASE_URL}/utility/colConfigDetail/${colConfigDetail.idColConfigDetail}`,
                    colConfigDetail
                );
            } catch (e) {
                // quiet fail to avoid UX noise; use console if you prefer
                // console.warn('saveColConfig failed', e);
            }
        },

        async reloadData() {
            if (!this.tableConfig) return;
            const ClassType = getClassByName(this.tableConfig.cliClassName);
            const dataRes = await axios.get(
                `${API_BASE_URL}/${this.tableConfig.restModuleName}/${this.tableConfig.dataCollectMethod}`,
                { params: this.filter }
            );
            this.items = dataRes.data.map(obj => {
                const item = obj instanceof ClassType ? obj : new ClassType(obj);
                this.tableConfig.columns.forEach(col => {
                    if (!(col.colName in item)) item[col.colName] = '';
                });
                return item;
            });

            // ⬇️ Trigger layout recalculation AFTER DOM updates
            this.$nextTick(() => {
                this.calculateTableDimensions();
            });
        },
    },
    watch: {
        filter: {
            handler(newFilter, oldFilter) {
                this.reloadData();
            },
            deep: true
        }
    }
}
</script>

<style scoped>
.action-icons {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
}

.icon {
    width: 24px;
    height: 24px;
    vertical-align: middle;
}

.masterdata-bg,
.masterdata-content,
.masterdata-table-container,
.masterdata-table-header,
.masterdata-tbody-scroll {
    box-sizing: border-box;
}

/* Outer layout */
.masterdata-bg {
    width: 100%;
    height: 100%;
    background: #fff;
    display: flex;
    flex-direction: column;
    border: red 2px solid;
    overflow: hidden;
}

.masterdata-content {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding-bottom: 24px;
    min-height: 0;
    /* critical for nested flex + scroll */
    min-width: 0;
    /* critical in flex layouts to allow overflow/scroll */
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
}

/* Header stays visible; will follow horizontally via syncHeaderScroll */
.masterdata-table-header {
    flex: 0 0 auto;
    width: 100%;
    overflow: hidden;
    min-width: 0;
    will-change: transform;
}

/* tbody is the scroll region for both axes */
.masterdata-tbody-scroll {
    flex: 1 1 auto;
    width: 100%;
    overflow-y: auto;
    /* vertical scroll when rows exceed height */
    overflow-x: auto;
    /* horizontal scroll when columns exceed width */
    min-width: 0;
    min-height: 0;
    max-height: 100%;
    scrollbar-gutter: stable both-edges;
    display: block;
}

/* Table sizing: fill container when narrow, grow when wide (no shrink) */
.masterdata-table {
    table-layout: fixed;
    border-collapse: collapse;
    width: max-content;

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
    background: #e3f9fc !important;
}

.masterdata-table .row-selected td,
tr.row-selected td {
    background: #e0f7fa !important;
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
