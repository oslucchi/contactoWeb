<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/Agenda/EventDetailsModal.vue -->
<template>
    <div class="modal-overlay">
        <div class="modal-content">
            <button class="modal-close" @click="$emit('close')">X</button>
            <div v-if="event && event.iconName" class="icon-container">
                <img :src="getIconPath(event.iconName)" :alt="event.iconName" class="event-icon" />
            </div>
            <h3>Dettagli Evento</h3>
            <div v-if="event">
                <p><strong>Data:</strong> {{ formatDateTime(event.date) }}</p>
                <p><strong>Durata:</strong> {{ event.duration }} min</p>
                <p><strong>Descrizione:</strong> {{ event.description }}</p>
                <p><strong>Azienda:</strong> {{ event.company }}</p>
                <p><strong>Categoria:</strong> {{ event.idEventCategory }}</p>
                <h4 class="reports-header">
                    <span style="margin-top: 5px">Report disponibili</span>
                    <button class="add-report-btn" @click="openAddReportModal" title="Aggiungi report">
                        <img src="@/assets/icons/add.png" alt="Add" class="add-icon" />
                    </button>
                </h4>
                <div v-if="loading">Caricamento report...</div>
                <ul v-else>
                    <li v-if="!reports || reports.length === 0">Nessun report disponibile.</li>
                    <li v-for="report in reports" :key="report.idReport" @click="openEditReportModal(report)"
                        style="cursor:pointer; text-decoration:underline;">
                        {{ formatDateTime(report.date) }} - {{ report.summary }}
                    </li>
                </ul>
            </div>
            <ReportDetailsModal v-if="showReportModal" :report="editedReport" :is-adding="isAddingReport"
                @close="closeReportModal" @save="handleSaveReport" />
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs';
import ReportDetailsModal from './ReportDetailsModal.vue';
import Report from '../../types/Report';

export default {
    components: { ReportDetailsModal },
    props: {
        event: Object,
        reports: Array,
        loading: Boolean
    },
    data() {
        return {
            showReportModal: false,
            editedReport: null,
            isAddingReport: false,
        };
    },
    methods: {
        formatDateTime(date) {
            if (!date) return '';
            return dayjs(date).format('YY/MM/DD HH:mm');
        },
        getIconPath(iconName) {
            try {
                return require(`@/assets/icons/${iconName}.png`);
            } catch (e) {
                return '';
            }
        },
        openAddReportModal() {
            this.editedReport = new Report({
                idEvent: this.event.idEvent,
                idCompany: this.event.idCompany,
                idAgent: this.event.idAgent,
                date: new Date(),
                summary: '',
                report: ''
            });
            this.isAddingReport = true;
            this.showReportModal = true;
        },
        openEditReportModal(report) {
            this.editedReport = new Report({
                ...report,
                date: new Date(report.date),
            });
            this.isAddingReport = false;
            this.showReportModal = true;
        },
        closeReportModal() {
            this.showReportModal = false;
            this.editedReport = null;
        },
        handleSaveReport(report) {
            if (this.isAddingReport) {
                // Add to local reports array or emit to parent if needed
                this.$emit('add-report', report);
            }
            else {
                // Update local reports array or emit to parent if needed
                this.$emit('edit-report', report);
            }
            this.closeReportModal();
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
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: #fff;
    padding: 24px;
    border-radius: 8px;
    min-width: 320px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    text-align: center;
}

.icon-container {
    margin-bottom: 12px;
}

.event-icon {
    width: 64px;
    height: 64px;
    object-fit: contain;
    display: block;
    margin: 0 auto 8px auto;
}

.modal-close {
    position: absolute;
    top: 8px;
    right: 12px;
    background: #eee;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    font-size: 18px;
    cursor: pointer;
}

.add-report-btn {
    background: none;
    border: none;
    margin-left: 8px;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
}

ul {
    text-align: left;
    padding-left: 1.5em;
    margin: 0.5em 0;
}

ul li {
    text-align: left;
    margin-bottom: 0.5em;
}

.reports-header {
    display: flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    ;
    gap: 8px;
    /* space between text and icon */
    margin: 0;
    padding: 0;
}

.add-icon {
    width: 20px;
    height: 20px;
    display: inline-block;
    object-fit: contain;
    margin-left: 0;
    /* Remove vertical-align if present */
}
</style>