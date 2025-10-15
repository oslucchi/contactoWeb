<template>
    <div class="masterdata-bg"
        @click="deselectRow">
        <div class="masterdata-content" >
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
            <div class="masterdata-table-container" 
                 :style="{ height: tableHeight + 'px', width: containerWidth + 'px', padding: '2px', overflowX: 'auto' }">
                <div class="masterdata-table-header" 
                     :style="{ width: tableWidth + 'px' }">
                    <table class="masterdata-table">
                        <colgroup>
                            <col v-for="col in visibleColumns" :key="col.idColConfigDetail"
                                :style="{ width: (col.width || 120) + 'px' }" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th v-for="col in visibleColumns"
                                    :key="col.idColConfigDetail"
                                    :style="{ width: (col.width || 120) + 'px' }"
                                    @click="handleSort(col.colName)">
                                    {{ col.showName }}
                                    <span v-if="sortColumn === col.colName" class="sort-arrow">
                                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                                    </span>
                                </th>
                            </tr>
                        </thead>
                    </table>
                </div>
                <div class="masterdata-tbody-scroll"
                     :style="{ width: tableWidth + 'px', maxHeight: bodyHeight + 'px', overflowY: 'auto', overflowX: 'auto' }">
                    <table class="masterdata-table">
                        <colgroup>
                            <col v-for="col in visibleColumns" :key="col.idColConfigDetail"
                                :style="{ width: (col.width || 120) + 'px' }" />
                        </colgroup>
                        <tbody>
                            <tr v-for="(item, rowIdx) in sortedItems" :key="getRowIdFromData(item, rowIdx)"
                                :class="{ 'row-selected': selectedRowId === getRowIdFromData(item, rowIdx) }">
                                <td v-for="col in visibleColumns"
                                    :key="col.idColConfigDetail"
                                    :style="{ width: (col.width || 120) + 'px' }"
                                    :class="{ 'td-editable': selectedRowId === getRowIdFromData(item, rowIdx) && selectedCell === col.colName && featuresEnabled[4] }"
                                    @click.stop="selectedRowId === getRowIdFromData(item, rowIdx) ? selectCell(item, rowIdx, col.colName) : selectRow(item, rowIdx)">
                                    <div v-if="item[col.colName] !== undefined"
                                        style="width: 100%; display: flex; align-items: center; font-family: inherit; font-size: inherit; font-weight: inherit; padding: 2px 6px;">
                                        <div v-if="selectedCell === col.colName && featuresEnabled[4]">
                                            <input class="table-input" v-model="item[col.colName]" style="width: 100%;" />
                                        </div>
                                        <div v-else>
                                            {{ item[col.colName] !== undefined ? item[col.colName] : JSON.stringify(item) }}
                                        </div>
                                    </div>
                                    <div v-else>
                                        <!-- Empty cell for padding -->
                                        &nbsp;
                                    </div>
                                </td> 
                           </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <!-- Edit Modal Placeholder -->
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

export default {
    props: {
        page: { type: String, required: true },
        element: { type: String, required: true },
        user: { type: Number, required: true },
        filter: { type: Object, default: () => ({}) },
        featuresEnabled: { type: Array, default: () => [false, false, false, false, false] },
        editCellEnabled: { type: Boolean, default: false },
        tableHeight: { type: Number, required: true },
        containerWidth: { type: Number, required: true },
    },
    data() {
        return {
            tableConfig: null,
            items: [],
            selectedRowId: null,
            selectedCell: null,
            showEditModal: false,
            selectedItem: null,
            sortColumn: null,
            sortDirection: null,
            tableRenderKey: 0,
            bodyHeight: 280,  // Subtract header height
            tableWidth: 800,  // Sum of colConfig widths or container width
            rowHeight: 20,
        };
    },

    mounted() {
        // Optionally, add resize event listener to recalculate sizes
        window.addEventListener('resize', this.calculateTableDimensions);
        this.calculateTableDimensions();
        console.log('Mounted with containerWidth:', this.containerWidth);
    },

    computed: {
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
        visibleColumns() {
            if (!this.tableConfig) return [];
            return this.tableConfig.columns
                .filter(col => col.visible)
                .sort((a, b) => a.position - b.position);
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
        const configRes = await axios.get(`${API_BASE_URL}/utility/browserData`, {
            params: {
                page: this.page,
                element: this.element,
                user: this.user
            }
        });
        this.tableConfig = new ColConfigHeader(configRes.data);

        const ClassType = getClassByName(this.tableConfig.cliClassName);
        const dataRes = await axios.get(`${API_BASE_URL}/${this.tableConfig.restModuleName}/${this.tableConfig.dataCollectMethod}`, { params: this.filter });
        this.items = dataRes.data.map(obj => {
            const item = obj instanceof ClassType ? obj : new ClassType(obj);
            this.tableConfig.columns.forEach(col => {
                if (!(col.colName in item)) item[col.colName] = '';
            });
            return item;
        });
        if (this.items.length && this.visibleColumns.length) {
            const firstCol = this.visibleColumns[0].colName;
        }
    },
    methods: {
        calculateTableDimensions() {
            const availableWidth = this.$el.parentElement.offsetWidth;
            const rowHeight = this.rowHeight; // Use config value
            const visibleRows = Math.max(1, Math.floor((this.tableHeight - 4)/ rowHeight) - 1);
            this.bodyHeight = visibleRows * rowHeight;

            const totalColWidth = this.visibleColumns.reduce((sum, col) => sum + (col.width || 120), 0);
            this.tableWidth = Math.max(availableWidth, totalColWidth);
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
        startResize(event, col) {
            event.preventDefault();
            const startX = event.pageX;
            const startWidth = col.width || 120;
            const container = event.target.closest('.masterdata-table-container');
            const containerWidth = container.offsetWidth;

            const initialWidths = this.visibleColumns.map(c => c.width || 120);

            const onMouseMove = (e) => {
                const delta = e.pageX - startX;
                let newWidth = Math.max(40, startWidth + delta);

                const otherTotal = initialWidths.reduce((sum, w, idx) => sum + (this.visibleColumns[idx] === col ? 0 : w), 0);
                const remainingWidth = containerWidth - newWidth;
                const scale = remainingWidth / otherTotal;

                col.width = newWidth;

                this.visibleColumns.forEach((c, idx) => {
                    if (c !== col) {
                        c.width = Math.max(40, Math.round(initialWidths[idx] * scale));
                    }
                });
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);

                this.visibleColumns.forEach(c => this.saveColConfig({ ...c }));
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },
        async saveColConfig(colConfigDetail) {
            try {
                await axios.put(
                    `${API_BASE_URL}/utility/colConfigDetail/${colConfigDetail.idColConfigDetail}`,
                    colConfigDetail
                );
            } catch (e) {
                alert('Error saving column configuration');
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
.masterdata-bg {
    width: 100%;
    height: 100%;
    background: #fff;
    display: flex;
    flex-direction: column;
}

.masterdata-content {
    flex: 1;
    width: 100%;
    margin: 0 auto;
    padding-bottom: 24px;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

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

.masterdata-table-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px;
    box-sizing: border-box;
}

.masterdata-tbody-scroll {
    width: 100%;
    overflow-y: auto;
    overflow-x: auto;
}

.masterdata-table {
    table-layout: fixed;
    border-collapse: collapse;
    width: max-content;
    max-width: max-content;
}

.masterdata-table th,
.masterdata-table td {
    border: 1px solid #888;
    padding: 2px 6px;
    text-align: left;
    box-sizing: border-box;
    background: #fff;
    height: 18px;
    vertical-align: middle;
}

.masterdata-table th {
    background: #f0f0f0;
    position: relative;
    user-select: none;
    cursor: pointer;
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