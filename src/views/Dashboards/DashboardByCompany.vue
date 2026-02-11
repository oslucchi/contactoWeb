<template>
    <div class="dashboard-layout">
        <!-- Left Panel (3/4 width) -->
        <div class="left-panel" ref="leftPanel">
            <!-- Row 1: Company (2/3) + Events (1/3) - Resizable -->
            <div class="companies-and-events" ref="companiesAndEvents">
                <!-- Companies -->
                <section 
                    ref="companiesSection" 
                    class="dashboard-block companies-block"
                    :style="{ width: companiesWidth + 'px' }"
                >
                    <GenericDataViewer 
                        ref="companyViewer" 
                        page="dashboard" 
                        element="Company" 
                        :user="currentUser && currentUser.idUser"
                        :filter="companySearchFilter"
                        :featuresEnabled="[false, false, false, true, true]"
                        :tableHeight="companiesHeight" 
                        :containerWidth="companiesWidth" 
                        :filter-configs="[
                            { fieldName: 'segment', label: 'Segment' }
                        ]"
                        @rowSelected="onCompanySelected" />
                </section>
                
                <!-- Vertical divider between Company and Events -->
                <div class="vertical-divider" @pointerdown.prevent="startHorizontalDrag"></div>
                
                <!-- Events -->
                <section 
                    ref="eventsSection" 
                    class="dashboard-block events-block"
                    :style="{ width: eventsWidth + 'px' }"
                >
                    <GenericDataViewer 
                        ref="eventsViewer" 
                        page="dashboard" 
                        element="Event" 
                        :user="currentUser && currentUser.idUser"
                        :filter="companyFilter"
                        :featuresEnabled="eventFeaturesEnabled"
                        :tableHeight="eventsHeight" 
                        :containerWidth="eventsWidth"
                        :customActions="eventCustomActionsComputed"
                        @rowSelected="onEventSelected"
                        @addItem="onAddEvent"
                        @deleteItem="onDeleteEvent"
                        @customAction="handleEventCustomAction" />
                </section>
            </div>

            <!-- Horizontal Divider -->
            <div class="divider" ref="divider1" @pointerdown.prevent="startDrag('companiesAndEvents','branchesSection', $event)"></div>

            <!-- Row 2: Branches - Resizable -->
            <section 
                ref="branchesSection" 
                class="dashboard-block branches-block"
                :style="{ height: branchesHeight + 'px' }"
            >
                <GenericDataViewer 
                    ref="branchViewer" 
                    page="dashboard" 
                    element="Branch" 
                    :user="currentUser && currentUser.idUser"
                    :filter="companyFilter" 
                    :featuresEnabled="[false, false, false, false, false]"
                    :tableHeight="branchesHeight" 
                    :containerWidth="leftPanelWidth"
                    @rowSelected="onBranchSelected" />
            </section>

            <!-- Horizontal Divider -->
            <div class="divider" ref="divider2" @pointerdown.prevent="startDrag('branchesSection','personsSection', $event)"></div>

            <!-- Row 3: Persons - Resizable -->
            <section 
                ref="personsSection" 
                class="dashboard-block persons-block"
                :style="{ height: personsHeight + 'px' }"
            >
                <GenericDataViewer 
                    ref="personViewer" 
                    page="dashboard" 
                    element="Person" 
                    :user="currentUser && currentUser.idUser"
                    :filter="companyFilter" 
                    :featuresEnabled="[false, false, false, true, false]"
                    :tableHeight="personsHeight" 
                    :containerWidth="leftPanelWidth"
                    @rowSelected="onPersonSelected" />
            </section>
        </div>
        
        <!-- Right Panel (1/4 width) -->
        <div ref="sidebar" 
             class="sidebar"
        >
            <!-- Reports Section -->
            <section 
                ref="reportsSection" 
                class="dashboard-block reports-block"
                :style="{ height: reportsHeight + 'px' }"
            >
                <GenericDataViewer 
                    ref="reportsViewer" 
                    page="dashboard" 
                    element="Report" 
                    :user="currentUser && currentUser.idUser"
                    :filter="reportFilter"
                    :featuresEnabled="reportFeaturesEnabled"
                    :tableHeight="reportsHeight" 
                    :containerWidth="sidebarWidth"
                    :highlightCondition="reportHighlightCondition"
                    @rowSelected="onReportSelected"
                    @addItem="onAddReport" />
            </section>
            
            <!-- Details Section -->
            <section 
                ref="reportDetails" 
                class="dashboard-block details-block"
            >
                <div v-if="selectedReport" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
                    <h3 style="color: rgb(114, 173, 69); margin: 0 0 12px 0;">Details</h3>
                    <div v-if="selectedEvent" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
                        <p style="margin: 0 0 8px 0;"><strong>Date:</strong> {{ formatDate(selectedEvent.date) || 'N/A' }}</p>
                        <textarea
                            v-model="selectedReport.report"
                            style="flex: 1; font-size:1.2rem; width:100%; box-sizing:border-box; overflow:auto; resize:none; min-height: 0;"
                            @blur="onSelectedReportBlur"
                        ></textarea>
                    </div>
                    <div v-else>
                        <p>No event selected.</p>
                    </div>
                </div>
                <div v-else style="padding: 12px; color: #999;">
                    <p>Select a report to view details</p>
                </div>
            </section>
        </div>
        
        <!-- Generic Entity Editor Modal -->
        <GenericEntityEditor
            :show="showEntityModal"
            :title="entityModalConfig ? entityModalConfig.title : 'Edit Item'"
            :entity="entityModalConfig ? entityModalConfig.entity : null"
            :fieldDefinitions="entityModalConfig ? entityModalConfig.fieldDefinitions : null"
            @save="onEntitySave"
            @cancel="onEntityCancel"
        />
    </div>
</template>

<script>
import GenericDataViewer from '@/views/Utils/GenericDataViewer.vue';
import GenericEntityEditor from '@/views/Utils/GenericEntityEditor.vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import dayjs from 'dayjs';
import { EVENT_STATUS, EVENT_OUTCOME, EVENT_CATEGORY, DEFAULT_EVENT_DURATION, REPORT_STATUS } from '@/constants';
import { mapGetters } from 'vuex';

export default {
    components: { GenericDataViewer, GenericEntityEditor },
    data() {
        return {
            selectedReportOriginalContent: '',
            companySearchFilter: { searchFor: '' },

            selectedCompany: null,
            selectedBranch: null,
            companyFilter: { id: -1 },
            branchFilter: { id: -1 },
            eventFilter: { id: -1 },
            reportFilter: { id: -1 },
            selectedEvent: null,
            selectedReport: null,
            
            companiesHeight: 400,
            branchesHeight: 100,
            personsHeight: 220,
            eventsHeight: 400,
            reportsHeight: 300,
            
            // Resizable widths
            companiesWidth: 600,
            eventsWidth: 300,
            leftPanelWidth: 900,
            sidebarWidth: 300,

            // drag state
            _dragging: null,
            _pointerId: null,
            _lastY: null,
            _lastX: null,
            minSectionHeight: 80,
            minSectionWidth: 200,

            showReportModal: false,
            reportDraft: '',
            reportModalItem: null,
            reportModalRowIdx: null,

            _stretchTargetName: null,
            _shrinkTargetName: null,
            _stretchTarget: null,
            _shrinkTarget: null,
            
            // Entity editor modal state
            showEntityModal: false,
            entityModalConfig: null,
            
            // Custom actions for events viewer
            eventCustomActions: [
                {
                    id: 'quickPhoneCall',
                    icon: 'phoneCall.png',
                    label: 'Quick Phone Call',
                    position: 'left',
                    requiresSelection: false,
                    enabledWhen: null // Always enabled when company is selected (checked in computed)
                }
            ],
        };
    },
    computed: {
        ...mapGetters('auth', ['currentUser']),
        eventFeaturesEnabled() {
            // Enable add feature (index 2) only when a company is selected
            return [false, false, !!this.selectedCompany, true, true];
        },
        reportFeaturesEnabled() {
            // Enable add feature (index 2) when a company is selected
            // Reports can be added for a company with or without an event
            return [false, false, !!this.selectedCompany, false, false];
        },
        reportHighlightCondition() {
            // Return a function that determines if a report should be highlighted
            // Highlight reports that match the selected event
            const selectedEventId = this.selectedEvent ? this.selectedEvent.idEvent : null;
            console.log('[reportHighlightCondition] selectedEvent:', this.selectedEvent, 'selectedEventId:', selectedEventId);
            if (!selectedEventId) {
                return null; // No highlighting if no event is selected
            }
            return (report) => {
                const shouldHighlight = report && report.idEvent === selectedEventId;
                console.log('[reportHighlightCondition] report.idEvent:', report && report.idEvent, 'selectedEventId:', selectedEventId, 'shouldHighlight:', shouldHighlight);
                return shouldHighlight;
            };
        },
        eventCustomActionsComputed() {
            // Return custom actions with dynamic enabledWhen based on selected company
            return this.eventCustomActions.map(action => ({
                ...action,
                enabledWhen: () => !!this.selectedCompany
            }));
        }
    },
    mounted() {
        this._boundHandleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this._boundHandleResize);

        // Initialize panel widths based on container
        this.$nextTick(() => {
            this.initializePanelWidths();
            this.handleResize();
        });
    },
    beforeDestroy() {
        if (this._boundHandleResize) window.removeEventListener('resize', this._boundHandleResize);
        this._removePointerListeners();
        if (this._rafPending) cancelAnimationFrame(this._rafPending);
    },
    methods: {
        initializePanelWidths() {
            const containerWidth = (this.$el && this.$el.getBoundingClientRect) ? this.$el.getBoundingClientRect().width : window.innerWidth;
            
            // Right sidebar = 1/4 of container
            this.sidebarWidth = Math.round(containerWidth * 0.25);
            
            // Left panel = 3/4 of container
            this.leftPanelWidth = Math.round(containerWidth * 0.75);
            
            // Within left panel: Company = 2/3, Events = 1/3
            this.companiesWidth = Math.round(this.leftPanelWidth * 0.66);
            this.eventsWidth = Math.round(this.leftPanelWidth * 0.33);
        },
        
        handleResize() {
            this.initializePanelWidths();
            this.$nextTick(() => this._callChildrenCalc());
        },
        
        formatDate(value, format) {
            if (!value && value !== 0) return 'N/A';
            try {
                const d = dayjs(value);
                if (!d.isValid()) return 'N/A';
                return d.format(format || 'YY/MM/DD HH:mm');
            } catch (e) {
                return 'N/A';
            }
        },

        onCompanySelected(payload) {
            const id = payload && payload.id ? payload.id : null;
            this.selectedCompany = payload && payload.item ? payload.item : null;
            this.companyFilter = id ? { id } : { id: -1 };

            if (id) {
                this.branchFilter = { idCompany: id, companyId: id };
                // Load all reports for this company (requires backend endpoint)
                this.reportFilter = { idCompany: id };
            } else {
                this.branchFilter = { id: -1 };
                this.reportFilter = { id: -1 };
            }

            this.selectedBranch = null;
            this.selectedEvent = null;
            this.eventFilter = { id: -1 };
            this.selectedReport = null;
            this.selectedBranch = null;

            this.$nextTick(() => {
                try {
                    if (this.$refs.personViewer && typeof this.$refs.personViewer.reloadData === 'function') {
                        this.$refs.personViewer.reloadData();
                    } else if (this.$refs.personViewer && typeof this.$refs.personViewer.calculateTableDimensions === 'function') {
                        this.$refs.personViewer.calculateTableDimensions();
                    }
                    // Reload reports to show all reports for the company
                    if (this.$refs.reportsViewer && typeof this.$refs.reportsViewer.reloadData === 'function') {
                        this.$refs.reportsViewer.reloadData();
                    }
                    // Deselect any selected report row
                    if (this.$refs.reportsViewer) {
                        this.$refs.reportsViewer.selectedRowId = null;
                    }
                } catch (e) {
                    console.warn('person refresh failed', e);
                }
            });
        },

        onBranchSelected(payload) {
            const id = payload && payload.id ? payload.id : null;
            this.selectedBranch = payload && payload.item ? payload.item : null;
            this.branchFilter = id ? { id } : { id: -1 };
            this.$nextTick(() => {
                if (this.$refs.personViewer && typeof this.$refs.personViewer.reloadData === 'function') {
                    this.$refs.personViewer.reloadData();
                }
            });
        },

        onPersonSelected(payload) {
            console.log('person selected', payload);
        },

        onEventSelected(payload) {
            const id = payload && payload.id ? payload.id : null;
            this.selectedEvent = payload && payload.item ? payload.item : null;
            this.eventFilter = id ? { id } : { id: -1 };
            this.selectedReport = null;
            
            // Auto-select the first report that matches this event
            this.$nextTick(() => {
                if (this.$refs.reportsViewer && this.selectedEvent) {
                    const reportsViewer = this.$refs.reportsViewer;
                    const eventId = this.selectedEvent.idEvent;
                    
                    // Find first report matching this event
                    if (reportsViewer.items && Array.isArray(reportsViewer.items)) {
                        const matchingReport = reportsViewer.items.find(report => report && report.idEvent === eventId);
                        if (matchingReport) {
                            // Get the row ID and select it
                            const rowId = reportsViewer.getRowIdFromData(matchingReport);
                            if (rowId !== null) {
                                reportsViewer.selectedRowId = rowId;
                                this.selectedReport = Object.assign({}, matchingReport);
                                this.selectedReportOriginalContent = this.selectedReport && this.selectedReport.report != null
                                    ? String(this.selectedReport.report)
                                    : '';
                            }
                        }
                    }
                }
                
                if (this.$refs.reportsViewer && typeof this.$refs.reportsViewer.calculateTableDimensions === 'function') {
                    this.$refs.reportsViewer.calculateTableDimensions();
                }
            });
        },

        onReportSelected(payload) {
            console.log('report selected', payload);
            const item = payload && payload.item ? payload.item : null;
            this.selectedReport = item ? Object.assign({}, item) : null;
            // store initial content so we can detect changes on blur
            this.selectedReportOriginalContent = this.selectedReport && this.selectedReport.report != null
              ? String(this.selectedReport.report)
              : '';
        },

        async saveSelectedReport() {
            try {
                const body = JSON.parse(JSON.stringify(this.selectedReport));

                // normalize date: ensure ISO-8601 UTC (backend usually accepts this)
                if (body.date) {
                    const d = new Date(body.date);
                    // fallback: if invalid date, leave as-is
                    if (!isNaN(d.getTime())) body.date = d.toISOString(); // e.g. "2005-01-11T16:34:00.000Z"
                }

                await axios.post(`${API_BASE_URL}/reports/update`, 
                                 { report: body });
                console.log('report changes saved');
                // update the original content snapshot after successful save
                this.selectedReportOriginalContent = this.selectedReport.report == null ? '' : String(this.selectedReport.report);
                // refresh reports list lightly so saved changes are visible
                this.$nextTick(() => {
                    if (this.$refs.reportsViewer && typeof this.$refs.reportsViewer.reloadData === 'function') {
                        this.$refs.reportsViewer.reloadData();
                    } else if (this.$refs.reportsViewer && typeof this.$refs.reportsViewer.calculateTableDimensions === 'function') {
                        this.$refs.reportsViewer.calculateTableDimensions();
                    }
                });
            } catch (e) {
                console.warn('saveSelectedReport failed', e);
            }
        },

        onSelectedReportBlur() {
            const current = this.selectedReport && this.selectedReport.report != null ? String(this.selectedReport.report) : '';
            const original = this.selectedReportOriginalContent || '';
            if (current !== original) {
                // ask confirmation
                const yes = window.confirm('The report was changed. Would you like to save the changes?');
                if (yes) {
                    console.log('saving report changes');
                    this.saveSelectedReport();
                } else {
                    // revert to original content
                    if (this.selectedReport) this.selectedReport.report = original;
                }
            }
        },

        onAddEvent(payload) {
            // Store the modal configuration and show it
            const now = new Date(); 
            now.setMinutes(0);
            now.setSeconds(0);
            now.setMilliseconds(0);
            now.setHours(now.getHours() + 1); // Next hour
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            
            console.log('onAddEvent - selectedCompany:', this.selectedCompany);
            
            // Get the Event class and create a new instance
            let EventClass = null;
            try {
                const mod = require(`@/types/${payload.tableConfig.cliClassName}`);
                EventClass = (mod && mod.default) ? mod.default : mod;
            } catch (e) {
                console.warn(`Could not load class ${payload.tableConfig.cliClassName}, using plain object`, e);
            }
            
            // Create new entity - either class instance or plain object
            const newEntity = EventClass ? new EventClass() : {};
            
            // Set default values
            const companyId = this.selectedCompany ? this.selectedCompany.idCompany : null;
            console.log('Setting idCompany to:', companyId);
            
            newEntity.idOwner = this.userId;
            newEntity.idCompany = companyId;
            newEntity.date = localDateTime;
            newEntity.duration = null;
            newEntity.icon = EVENT_CATEGORY.NONE;
            newEntity.description = '';
            newEntity.idEventStatus = EVENT_STATUS.PENDING;
            newEntity.idEventOutcome = EVENT_OUTCOME.PENDING;
            newEntity.title = '';
            
            console.log('newEntity after setting defaults:', JSON.stringify(newEntity));
            
            this.entityModalConfig = {
                title: `${this.$t('forms.forms.createEvent')}`,
                restModuleName: payload.tableConfig.restModuleName,
                viewerRef: 'eventsViewer',
                entity: newEntity,
                // Optional: define specific fields for Event
                fieldDefinitions: [
                    { name: 'idCompany', label: this.$t('forms.labels.company'), type: 'number', placeholder: this.$t('forms.placeholders.companyId'), editable: false, visible: false },
                    { name: 'idEventStatus', label: '', type: 'number', placeholder: '', editable: false, visible: false, defaultValue: EVENT_STATUS.PENDING },
                    { name: 'idEventOutcome', label: '', type: 'number', placeholder: '', editable: false, visible: false, defaultValue: EVENT_OUTCOME.PENDING },
                    { name: 'date', label: this.$t('forms.labels.date'), type: 'datetime', placeholder: 'Event date', editable: true, visible: true },
                    { name: 'duration', label: this.$t('forms.labels.duration'), type: 'number', placeholder: 'Event date', editable: true, visible: true },
                    { name: 'title', label: this.$t('forms.labels.title'), type: 'text', placeholder: 'Subject', editable: true, visible: true },
                    { 
                        name: 'idEventCategory', 
                        label: this.$t('forms.labels.category'),
                        type: 'icon-select', 
                        placeholder: this.$t('forms.labels.category'),
                        defaultValue: EVENT_CATEGORY.NONE,
                        options: [
                            { fileName: 'iconaBianca.png', value: EVENT_CATEGORY.NONE, label: this.$t('forms.labels.none') },
                            { fileName: 'meetInPerson.png', value: EVENT_CATEGORY.MEET_IN_PERSON, label: 'Meet in Person' },
                            { fileName: 'dollar.png', value: EVENT_CATEGORY.QUOTE_REQUEST, label: 'Request for quote' },
                            { fileName: 'phoneCall.png', value: EVENT_CATEGORY.PHONE_CALL, label: 'Phone Call' },
                            { fileName: 'videoCall.png', value: EVENT_CATEGORY.VIDEO_CALL, label: 'Video Call' }
                        ]
                    },
                    { name: 'description', label: this.$t('forms.placeholders.description'), type: 'textarea', placeholder: this.$t('forms.placeholders.description'), rows: 4 },
                    { 
                        name: 'participants', 
                        label: this.$t('forms.labels.participants') || 'Participants',
                        type: 'multi-select-table',
                        dataSource: {
                            restModuleName: 'persons',
                            searchParam: 'searchFor'
                        },
                        tableConfig: {
                            itemIdField: 'idPerson',
                            displayColumns: [
                                { colName: 'firstName', label: 'First Name', searchable: true, width: 100 },
                                { colName: 'familyName', label: 'Last Name', searchable: true, width: 100 },
                                { colName: 'email', label: 'Email', searchable: true, width: 150 },
                                { colName: 'company', label: 'Company', searchable: false, width: 120 }
                            ],
                            minSearchLength: 3,
                            maxResults: 15
                        },
                        placeholder: 'Type at least 3 characters to search by name or company...',
                        editable: true,
                        visible: true
                    }
                ]
            };
            this.showEntityModal = true;
        },
        
        onAddReport(payload) {
            // Store the modal configuration and show it
            const now = new Date();
            now.setMinutes(0);
            now.setSeconds(0);
            now.setMilliseconds(0);
            now.setHours(now.getHours() + 1); // Next hour
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            
            console.log('onAddReport - selectedEvent:', this.selectedEvent);
            
            // Get the Report class and create a new instance
            let ReportClass = null;
            try {
                const mod = require(`@/types/${payload.tableConfig.cliClassName}`);
                ReportClass = (mod && mod.default) ? mod.default : mod;
            } catch (e) {
                console.warn(`Could not load class ${payload.tableConfig.cliClassName}, using plain object`, e);
            }
            
            // Create new entity - either class instance or plain object
            const newEntity = ReportClass ? new ReportClass() : {};
            
            // Set default values
            // If an event is selected, link the report to it; otherwise, link only to the company
            const eventId = this.selectedEvent ? this.selectedEvent.idEvent : null;
            const companyId = this.selectedCompany ? this.selectedCompany.idCompany : null;
            console.log('Setting idEvent to:', eventId, 'idCompany to:', companyId);
            
            newEntity.idReporter = this.userId;
            newEntity.idEvent = eventId;
            newEntity.idCompany = companyId;
            newEntity.idAgent = this.userId;
            newEntity.date = localDateTime;
            newEntity.report = '';
            newEntity.summary = '';
            newEntity.archived = REPORT_STATUS.ACTIVE;
            
            console.log('newEntity after setting defaults:', JSON.stringify(newEntity));
            
            this.entityModalConfig = {
                title: `${this.$t('forms.forms.createReport') || 'Create Report'}`,
                restModuleName: payload.tableConfig.restModuleName,
                viewerRef: 'reportsViewer',
                entity: newEntity,
                fieldDefinitions: [
                    { name: 'idReporter', label: '', type: 'number', placeholder: '', editable: false, visible: false },
                    { name: 'idEvent', label: '', type: 'number', placeholder: '', editable: false, visible: false },
                    { name: 'idCompany', label: '', type: 'number', placeholder: '', editable: false, visible: false },
                    { name: 'idAgent', label: '', type: 'number', placeholder: '', editable: false, visible: false },
                    { name: 'date', label: this.$t('forms.labels.date') || 'Date', type: 'datetime', placeholder: 'Report date', editable: true, visible: true },
                    { name: 'summary', label: this.$t('forms.labels.summary') || 'Summary', type: 'text', placeholder: 'Brief summary', editable: true, visible: true },
                    { name: 'report', label: this.$t('forms.labels.report') || 'Report', type: 'textarea', placeholder: this.$t('forms.placeholders.description') || 'Detailed report', rows: 8, editable: true, visible: true },
                    { name: 'archived', label: this.$t('forms.labels.archived') || 'Archived', type: 'boolean', editable: true, visible: false }
                ]
            };
            this.showEntityModal = true;
        },
        
        async onEntitySave(entity) {
            if (!this.entityModalConfig) return;
            
            console.log('onEntitySave - received entity:', JSON.stringify(entity));
            
            try {
                // Clone and normalize the entity for backend
                const body = JSON.parse(JSON.stringify(entity));
                
                console.log('onEntitySave - body after clone:', JSON.stringify(body));
                
                // Convert datetime-local format to ISO-8601 for Java backend
                if (body.date && typeof body.date === 'string') {
                    const d = new Date(body.date);
                    if (!isNaN(d.getTime())) {
                        body.date = d.toISOString(); // Converts to "2026-02-09T10:00:00.000Z"
                    }
                }
                
                console.log('onEntitySave - body being sent to backend:', JSON.stringify(body));
                
                const res = await axios.post(
                    `${API_BASE_URL}/${this.entityModalConfig.restModuleName}/create`, 
                    body
                );
                
                // Close modal
                this.showEntityModal = false;
                
                // Refresh the appropriate viewer
                const viewerRef = this.entityModalConfig.viewerRef;
                if (viewerRef && this.$refs[viewerRef] && typeof this.$refs[viewerRef].reloadData === 'function') {
                    await this.$refs[viewerRef].reloadData();
                }

                console.log('Entity created:', res.data);
            } catch (e) {
                console.error('Failed to create entity:', e);
                alert('Failed to create item. Please try again.');
            }
        },
        
        onEntityCancel() {
            this.showEntityModal = false;
            this.entityModalConfig = null;
        },

        handleEventCustomAction(payload) {
            if (payload.actionId === 'quickPhoneCall') {
                // Create a quick phone call event
                this.createQuickPhoneCall();
            }
        },

        createQuickPhoneCall() {
            if (!this.selectedCompany) {
                alert('Please select a company first');
                return;
            }

            // Set date to next hour
            const now = new Date();
            now.setMinutes(0);
            now.setSeconds(0);
            now.setMilliseconds(0);
            now.setHours(now.getHours() + 1);
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

            // Get the Event class
            let EventClass = null;
            try {
                const mod = require('@/types/Event');
                EventClass = (mod && mod.default) ? mod.default : mod;
            } catch (e) {
                console.warn('Could not load Event class, using plain object', e);
            }

            const newEntity = EventClass ? new EventClass() : {};
            const companyId = this.selectedCompany.idCompany;

            // Set default values for phone call
            newEntity.idOwner = this.userId;
            newEntity.idCompany = companyId;
            newEntity.date = localDateTime;
            newEntity.duration = DEFAULT_EVENT_DURATION.PHONE_CALL;
            newEntity.idEventCategory = EVENT_CATEGORY.PHONE_CALL;
            newEntity.description = '';
            newEntity.idEventStatus = EVENT_STATUS.PENDING;
            newEntity.idEventOutcome = EVENT_OUTCOME.PENDING;
            newEntity.title = this.$t('forms.labels.recallAction');

            this.entityModalConfig = {
                title: `${this.$t('forms.forms.createEvent') || 'Create Event'} - Phone Call`,
                restModuleName: 'events',
                viewerRef: 'eventsViewer',
                entity: newEntity,
                fieldDefinitions: [
                    { name: 'idCompany', label: this.$t('forms.labels.company'), type: 'number', editable: false, visible: false },
                    { name: 'idEventStatus', label: '', type: 'number', editable: false, visible: false, defaultValue: EVENT_STATUS.PENDING },
                    { name: 'idEventOutcome', label: '', type: 'number', editable: false, visible: false, defaultValue: EVENT_OUTCOME.PENDING },
                    { name: 'date', label: this.$t('forms.labels.date'), type: 'datetime', editable: true, visible: true },
                    { name: 'duration', label: this.$t('forms.labels.duration'), type: 'number', editable: true, visible: true },
                    { name: 'title', label: this.$t('forms.labels.title'), type: 'text', editable: true, visible: true },
                    { 
                        name: 'idEventCategory', 
                        label: this.$t('forms.labels.category'),
                        type: 'icon-select', 
                        defaultValue: EVENT_CATEGORY.PHONE_CALL,
                        options: [
                            { fileName: 'phoneCall.png', value: EVENT_CATEGORY.PHONE_CALL, label: 'Phone Call' },
                            { fileName: 'meetInPerson.png', value: EVENT_CATEGORY.MEET_IN_PERSON, label: 'Meet in Person' },
                            { fileName: 'videoCall.png', value: EVENT_CATEGORY.VIDEO_CALL, label: 'Video Call' },
                            { fileName: 'iconaBianca.png', value: EVENT_CATEGORY.NONE, label: this.$t('forms.labels.none') },
                            { fileName: 'dollar.png', value: EVENT_CATEGORY.QUOTE_REQUEST, label: 'Request for quote' }
                        ]
                    },
                    { name: 'description', label: this.$t('forms.placeholders.description'), type: 'textarea', rows: 4 },
                    { 
                        name: 'participants', 
                        label: this.$t('forms.labels.participants') || 'Participants',
                        type: 'multi-select-table',
                        dataSource: {
                            restModuleName: 'persons',
                            searchParam: 'searchFor'
                        },
                        tableConfig: {
                            itemIdField: 'idPerson',
                            displayColumns: [
                                { colName: 'firstName', label: 'First Name', searchable: true, width: 100 },
                                { colName: 'familyName', label: 'Last Name', searchable: true, width: 100 },
                                { colName: 'email', label: 'Email', searchable: true, width: 150 },
                                { colName: 'company', label: 'Company', searchable: false, width: 120 }
                            ],
                            minSearchLength: 3,
                            maxResults: 15
                        },
                        placeholder: 'Type at least 3 characters to search by name or company...',
                        editable: true,
                        visible: true
                    }
                ]
            };
            this.showEntityModal = true;
        },

        async onDeleteEvent(payload) {
            const { item, itemIdField, tableConfig } = payload;
            let firstColName = 'name';
            if (payload.tableConfig && this.$refs.eventsViewer && this.$refs.eventsViewer.visibleColumns && this.$refs.eventsViewer.visibleColumns[0]) {
                firstColName = this.$refs.eventsViewer.visibleColumns[0].colName;
            }
            
            const displayName = item[firstColName] || item.id || 'this item';
            
            if (confirm(`Delete ${tableConfig.element} ${displayName}?`)) {
                try {
                    await axios.delete(`${API_BASE_URL}/${tableConfig.restModuleName}/${item[itemIdField]}`);
                    
                    // Clear selection if this was the selected event
                    if (this.selectedEvent && item[itemIdField] === this.selectedEvent[itemIdField]) {
                        this.selectedEvent = null;
                        this.eventFilter = { id: -1 };
                        this.selectedReport = null;
                    }
                    
                    // Refresh the events viewer
                    if (this.$refs.eventsViewer && typeof this.$refs.eventsViewer.reloadData === 'function') {
                        await this.$refs.eventsViewer.reloadData();
                    }
                } catch (e) {
                    console.error('Failed to delete event:', e);
                    alert('Failed to delete event. Please try again.');
                }
            }
        },


        // open dashboard modal and populate draft
        openDashboardReportModal(item, rowIdx) {
            this.reportModalItem = item || null;
            this.reportModalRowIdx = rowIdx;
            this.reportDraft = (item && item.report !== undefined) ? String(item.report) : '';
            this.showReportModal = true;
        },

        // pointer drag for vertical resizing
        startDrag(targetRefName, shrinkRefName, evt) {
            try {
                if (evt && evt.currentTarget &&
                    typeof evt.currentTarget.setPointerCapture === 'function') {
                    evt.currentTarget.setPointerCapture(evt.pointerId);
                }
            } catch (e) { /* ignore */ }

            this._pointerId = evt && evt.pointerId ? evt.pointerId : null;
            this._dragging = true;
            this._dragMode = 'vertical';
            // cache ref names and nodes for the drag operation
            this._stretchTargetName = targetRefName || null;
            this._shrinkTargetName = shrinkRefName || null;
            this._stretchTarget = (this.$refs && targetRefName) ? this.$refs[targetRefName] : null;
            this._shrinkTarget = (this.$refs && shrinkRefName) ? this.$refs[shrinkRefName] : null;
            this._lastY = Number(evt && evt.clientY) || 0;

            // always bind fresh handlers so `this` is correct and removal is reliable
            this._boundPointerMove = this._onPointerMove.bind(this);
            this._boundPointerUp = this._onPointerUp.bind(this);

            window.addEventListener('pointermove', this._boundPointerMove, { passive: false, capture: true });
            window.addEventListener('pointerup', this._boundPointerUp, { capture: true });
            window.addEventListener('pointercancel', this._boundPointerUp, { capture: true });

            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'row-resize';
        },
        
        // pointer drag for horizontal resizing (Company/Events split)
        startHorizontalDrag(evt) {
            try {
                if (evt && evt.currentTarget &&
                    typeof evt.currentTarget.setPointerCapture === 'function') {
                    evt.currentTarget.setPointerCapture(evt.pointerId);
                }
            } catch (e) { /* ignore */ }

            this._pointerId = evt && evt.pointerId ? evt.pointerId : null;
            this._dragging = true;
            this._dragMode = 'horizontal';
            this._lastX = Number(evt && evt.clientX) || 0;

            // bind handlers
            this._boundPointerMove = this._onPointerMove.bind(this);
            this._boundPointerUp = this._onPointerUp.bind(this);

            window.addEventListener('pointermove', this._boundPointerMove, { passive: false, capture: true });
            window.addEventListener('pointerup', this._boundPointerUp, { capture: true });
            window.addEventListener('pointercancel', this._boundPointerUp, { capture: true });

            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
        },

       _removePointerListeners() {
            if (this._boundPointerMove) {
                try { window.removeEventListener('pointermove', this._boundPointerMove, { capture: true }); } catch (e) { }
                this._boundPointerMove = null;
            }
            if (this._boundPointerUp) {
                try {
                    window.removeEventListener('pointerup', this._boundPointerUp, { capture: true });
                    window.removeEventListener('pointercancel', this._boundPointerUp, { capture: true });
                } catch (e) { }
                this._boundPointerUp = null;
            }

            // restore page-level styles and clear pointer id
            try {
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            } catch (e) { /* ignore */ }

            this._pointerId = null;
        },

        _onPointerMove(evt) {
            if (!this._dragging) return;
            if (this._pointerId !== null && evt && evt.pointerId !== this._pointerId) return;
            if (evt) evt.preventDefault();

            if (this._dragMode === 'horizontal') {
                // Horizontal drag - resize Company/Events split
                const clientX = (evt && evt.clientX) ? Number(evt.clientX) : NaN;
                if (!isFinite(clientX)) return;
                let dx = clientX - Number(this._lastX || 0);
                this._lastX = clientX;
                if (!isFinite(dx) || dx === 0) return;

                const minW = Number(this.minSectionWidth) || 200;
                const newCompaniesWidth = Math.max(minW, this.companiesWidth + dx);
                const newEventsWidth = Math.max(minW, this.eventsWidth - dx);

                // Only update if both panels meet minimum width
                if (newCompaniesWidth >= minW && newEventsWidth >= minW) {
                    this.companiesWidth = Math.round(newCompaniesWidth);
                    this.eventsWidth = Math.round(newEventsWidth);
                    this.$nextTick(() => this._callChildrenCalc());
                }
            } else {
                // Vertical drag - resize sections vertically
                const clientY = (evt && evt.clientY) ? Number(evt.clientY) : NaN;
                if (!isFinite(clientY)) return;
                let dy = clientY - Number(this._lastY || 0);
                this._lastY = clientY;
                if (!isFinite(dy) || dy === 0) return;

                const minH = Number(this.minSectionHeight) || 0;
                const topEl = this._stretchTarget;
                const bottomEl = this._shrinkTarget;
                if (topEl && bottomEl) {
                    const currTop = topEl.getBoundingClientRect().height;
                    const currBottom = bottomEl.getBoundingClientRect().height;
                    const newTop = Math.max(minH, Math.round(currTop + dy));
                    const newBottom = Math.max(minH, Math.round(currBottom - dy));

                    topEl.style.height = newTop + 'px';
                    bottomEl.style.height = newBottom + 'px';

                    // update stored numeric heights used by children
                    if (this._stretchTargetName === 'companiesAndEvents') {
                        const compRef = this.$refs.companiesSection;
                        const eventsRef = this.$refs.eventsSection;
                        if (compRef) this.companiesHeight = Math.round(compRef.getBoundingClientRect().height);
                        if (eventsRef) this.eventsHeight = Math.round(eventsRef.getBoundingClientRect().height);
                        if (bottomEl === this.$refs.branchesSection) this.branchesHeight = Math.round(newBottom);
                    } else {
                        // generic mapping for named refs to data fields
                        if (this._stretchTargetName === 'branchesSection') this.branchesHeight = Math.round(newTop);
                        if (this._shrinkTargetName === 'personsSection') this.personsHeight = Math.round(newBottom);
                    }
                }

                this._callChildrenCalc();
            }
        },

        _onPointerUp(evt) {
            if (this._pointerId !== null && evt && evt.pointerId !== undefined && evt.pointerId !== this._pointerId) return;
            this._dragging = null;
            this._dragMode = null;
            // clear cached refs
            this._stretchTargetName = null;
            this._shrinkTargetName = null;
            this._stretchTarget = null;
            this._shrinkTarget = null;
            this._pointerId = null;
            this._lastY = null;
            this._lastX = null;
            this._removePointerListeners();
            this.$nextTick(() => this._callChildrenCalc());
        },

        _callChildrenCalc() {
            try {
                if (this.$refs.companyViewer && typeof this.$refs.companyViewer.calculateTableDimensions === 'function') {
                    this.$refs.companyViewer.calculateTableDimensions();
                }
                if (this.$refs.branchViewer && typeof this.$refs.branchViewer.calculateTableDimensions === 'function') {
                    this.$refs.branchViewer.calculateTableDimensions();
                }
                if (this.$refs.personViewer && typeof this.$refs.personViewer.calculateTableDimensions === 'function') {
                    this.$refs.personViewer.calculateTableDimensions();
                }
                if (this.$refs.personViewer && typeof this.$refs.personViewer.reloadData === 'function') {
                    this.$refs.personViewer.reloadData();
                }
            } catch (e) {
                console.warn('child recalc failed', e);
            }
        },
    },
};
</script>

<style scoped>
*,
*::before,
*::after {
    box-sizing: border-box;
}

/* Main layout - horizontal split */
.dashboard-layout {
    display: flex;
    flex-direction: row;
    gap: 0;
    height: calc(100vh - var(--page-header-height, 100px));
    width: 100%;
    min-height: 0;
    overflow: hidden;
}

/* Left panel - 3/4 width, contains Company/Events, Branches, Persons */
.left-panel {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 8px;
    min-height: 0;
    height: 100%;
    overflow: hidden;
}

/* Top row in left panel - Company and Events side by side */
.companies-and-events {
    display: flex;
    flex-direction: row;
    gap: 0;
    min-height: 200px;
    height: 400px;
    width: 100%;
    overflow: hidden;
}

/* Company and Events blocks */
.companies-block,
.events-block {
    flex: 0 0 auto;
    min-height: 0;
    height: 100%;
    padding: 4px;
    overflow: hidden;
}

/* Vertical divider between Company and Events */
.vertical-divider {
    width: 8px;
    cursor: col-resize;
    display: block;
    margin: 0;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.02), rgba(255, 255, 255, 0.02));
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    touch-action: none;
    z-index: 5;
    flex-shrink: 0;
}

.vertical-divider:hover {
    background: rgba(0, 0, 0, 0.08);
}

/* Horizontal divider for vertical resizing */
.divider {
    height: 8px;
    cursor: row-resize;
    display: block;
    margin: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.02), rgba(255, 255, 255, 0.02));
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    touch-action: none;
    z-index: 5;
    flex-shrink: 0;
}

.divider:hover {
    background: rgba(0, 0, 0, 0.08);
}

/* Branches and Persons blocks */
.branches-block,
.persons-block {
    flex: 0 0 auto;
    min-height: 80px;
    padding: 4px;
    overflow: hidden;
}

/* Right sidebar - 1/4 width */
.sidebar {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 0;
    height: 100%;
    border-left: 2px solid rgba(0,0,0,0.08);
    background: #fafafa;
    overflow: hidden;
}

/* Reports and Details sections in sidebar */
.reports-block {
    flex: 0 0 auto;
    min-height: 150px;
    padding: 8px;
    overflow: hidden;
    border-bottom: 1px solid rgba(0,0,0,0.08);
}

.details-block {
    flex: 1 1 auto;
    min-height: 0;
    padding: 8px;
    overflow: auto;
    display: flex;
    flex-direction: column;
}

.details-block textarea {
    flex: 1;
    min-height: 0;
    resize: none !important;
    overflow: auto;
    font-family: inherit;
}

.dashboard-block {
    min-height: 0;
    overflow: visible;
}
.modal-overlay {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.35);
  z-index: 9999;
}
.modal-content {
  background: #fff;
  max-width: 900px;
  width: calc(100% - 48px);
  border-radius: 6px;
  padding: 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.modal-close {
  position: absolute;
  right: 12px;
  top: 12px;
  background: transparent;
  border: none;
  font-weight: bold;
  cursor: pointer;
}
</style>