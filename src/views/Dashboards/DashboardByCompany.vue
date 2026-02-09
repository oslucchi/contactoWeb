<template>
    <div class="dashboard-layout">
        <div class="company-data">
            <div class="companies-and-events" ref ="companiesAndEvents">
                <!-- Companies -->
                <section 
                    ref="companiesSection" 
                    class="dashboard-block companies-block"
                >
                    <GenericDataViewer 
                        ref="companyViewer" 
                        page="dashboard" 
                        element="Company" 
                        :user="userId"
                        :filter="companySearchFilter"
                        :featuresEnabled="[false, false, false, true, true]"
                        :tableHeight="companiesHeight" 
                        :containerWidth="mainAreaWidth" 
                        :filter-configs="[
                            { fieldName: 'segment', label: 'Segment' }
                        ]"
                        @rowSelected="onCompanySelected" />
                </section>
                <!-- Events -->
                <section 
                    ref="eventsSection" 
                    class="dashboard-block events-block"
                >
                    <GenericDataViewer 
                        ref="eventsViewer" 
                        page="dashboard" 
                        element="Event" 
                        :user="userId"
                        :filter="companyFilter"
                        :featuresEnabled="eventFeaturesEnabled"
                        :tableHeight="eventsHeight" 
                        :containerWidth="eventAreaWidth"
                        :customActions="eventCustomActionsComputed"
                        @rowSelected="onEventSelected"
                        @addItem="onAddEvent"
                        @deleteItem="onDeleteEvent"
                        @customAction="handleEventCustomAction" />
                </section>
            </div>

            <!-- Divider -->
            <div class="divider" ref="divider1" @pointerdown.prevent="startDrag('companiesAndEvents','branchesSection', $event)"></div>

            <!-- Branches -->
            <section 
                ref="branchesSection" 
                class="dashboard-block branches-block"
                :style="{ height: branchesHeight + 'px' }"
            >
                <GenericDataViewer 
                    ref="branchViewer" 
                    page="dashboard" 
                    element="Branch" 
                    :user="userId"
                    :filter="companyFilter" 
                    :featuresEnabled="[false, false, false, false, false]"
                    :tableHeight="branchesHeight" 
                    :containerWidth="mainAreaWidth"
                    @rowSelected="onBranchSelected" />
            </section>

            <!-- Divider -->
            <div class="divider" ref="divider2" @pointerdown.prevent="startDrag('branchesSection','personsSection', $event)"></div>

            <!-- Persons -->
            <section 
                ref="personsSection" 
                class="dashboard-block persons-block"
                :style="{ height: personsHeight + 'px' }"
            >
                <GenericDataViewer 
                    ref="personViewer" 
                    page="dashboard" 
                    element="Person" 
                    :user="userId"
                    :filter="companyFilter" 
                    :featuresEnabled="[false, false, false, true, false]"
                    :tableHeight="personsHeight" 
                    :containerWidth="mainAreaWidth"
                    @rowSelected="onPersonSelected" />
            </section>
        </div>
        <div ref="sidebar" 
             class="sidebar" 
             :style="sidebarWidth !== null ? { width: sidebarWidth + 'px' } : {}"
        >
            <section 
            ref="reportsSection" 
                     class="dashboard-block reports-block"
                     :style="{ width: sidebarWidth + 'px', padding: '8px', height: '35%' }"
            >
                <GenericDataViewer 
                    ref="reportsViewer" 
                    page="dashboard" 
                    element="Report" 
                    :user="userId"
                    :filter="reportFilter"
                    :featuresEnabled="reportFeaturesEnabled"
                    :tableHeight="reportsHeight" 
                    :containerWidth="eventAreaWidth"
                    :highlightCondition="reportHighlightCondition"
                    @rowSelected="onReportSelected"
                    @addItem="onAddReport" />
            </section>
            <section 
                ref="reportDetails" 
                class="dashboard-block reports-block"
                :style="{ width: sidebarWidth + 'px', padding: '8px' }"
            >
                <div v-if="selectedReport" style="width: 100%; height: 100%;">
                    <h3 style="color: rgb(114, 173, 69);">Details</h3>
                    <div v-if="selectedEvent" style="width: 100%; height: 100%;">
                        <p><strong>Date:</strong> {{ formatDate(selectedEvent.date) || 'N/A' }}</p>
                        <span style="">
                            <textarea
                                v-model="selectedReport.report"
                                style="font-size:1.2rem; width:100%; height:100%; box-sizing:border-box; overflow:auto; resize:none;"
                                @blur="onSelectedReportBlur"
                            ></textarea>
                        </span>
                    </div>
                    <div v-else>
                        <p>No event selected.</p>
                    </div>
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

export default {
    components: { GenericDataViewer, GenericEntityEditor },
    data() {
        return {
            selectedReportOriginalContent: '',
            companySearchFilter: { searchFor: '' },

            userId: 1,
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
            reportsHeight: 400,
            eventAreaWidth: 350,

            // drag state
            _dragging: null,
            _pointerId: null,
            _lastY: null,            // <-- incremental approach
            minSectionHeight: 80,

            sidebarWidth: null,
            mainAreaWidth: 0,

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

        // measure initial sizes and observe sidebar for changes
        this.$nextTick(() => {
        this._measureSidebar();
        // observe sidebar resizing (e.g. CSS changes, responsive)
        if (window.ResizeObserver && this.$refs && this.$refs.sidebar) {
            this._sidebarResizeObserver = new ResizeObserver(() => this._measureSidebar());
            this._sidebarResizeObserver.observe(this.$refs.sidebar);
        }
        this.handleResize();
        });
    },
    beforeDestroy() {
        if (this._boundHandleResize) window.removeEventListener('resize', this._boundHandleResize);
        this._removePointerListeners();
        if (this._rafPending) cancelAnimationFrame(this._rafPending);
        if (this._sidebarResizeObserver) {
            try { this._sidebarResizeObserver.disconnect(); } catch (e) {}
            this._sidebarResizeObserver = null;
        }
    },
    methods: {
          formatDate(value, format) {
            if (!value && value !== 0) return 'N/A';
            try {
            // dayjs parses ISO / timezone forms; format as "YY/MM/DD HH:mm"
                const d = dayjs(value);
                if (!d.isValid()) return 'N/A';
                    return d.format(format || 'YY/MM/DD HH:mm');
            } catch (e) {
               return 'N/A';
            }
        },

        handleResize() {
            // compute mainAreaWidth from the dashboard container width minus sidebar
            const containerWidth = (this.$el && this.$el.getBoundingClientRect) ? this.$el.getBoundingClientRect().width : window.innerWidth;
            const sWidth = Number.isFinite(this.sidebarWidth) ? this.sidebarWidth : 0;
            // small gutter of 10px preserved as before
            this.mainAreaWidth = Math.max(0, Math.round(containerWidth - sWidth - 10));
            this.$nextTick(() => this._callChildrenCalc());
        },

        // measure actual sidebar width and also compute eventAreaWidth if needed
        _measureSidebar() {
            if (!this.$refs || !this.$refs.sidebar) return;
            const rect = this.$refs.sidebar.getBoundingClientRect();
            const w = Math.round(rect.width || 0);
            // update only if changed to avoid excessive reflows
            if (this.sidebarWidth !== w) {
            this.sidebarWidth = w;
            // eventAreaWidth used by inner GenericDataViewer (if you expose it)
            this.eventAreaWidth = Math.max(0, w - 16); // keep small padding allowance
            // trigger a recompute of main area width
            this.handleResize();
            }
        },

        onCompanySelected(payload) {
            const id = payload && payload.id ? payload.id : null;
            this.selectedCompany = payload && payload.item ? payload.item : null;
            this.companyFilter = id ? { id } : { id: -1 };

            if (id) {
                this.branchFilter = { idCompany: id, companyId: id };
                // Load all reports for this company (requires backend endpoint)
                this.reportFilter = { id: id };
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
            newEntity.icon = 4;
            newEntity.description = '';
            newEntity.idEventStatus = 1;
            newEntity.idEventOutcome = 1;
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
                    { name: 'idEventStatus', label: '', type: 'number', placeholder: '', editable: false, visible: false, defaultValue: 1 },
                    { name: 'idEventOutcome', label: '', type: 'number', placeholder: '', editable: false, visible: false, defaultValue: 1 },
                    { name: 'date', label: this.$t('forms.labels.date'), type: 'datetime', placeholder: 'Event date', editable: true, visible: true },
                    { name: 'duration', label: this.$t('forms.labels.duration'), type: 'number', placeholder: 'Event date', editable: true, visible: true },
                    { name: 'title', label: this.$t('forms.labels.title'), type: 'text', placeholder: 'Subject', editable: true, visible: true },
                    { 
                        name: 'idEventCategory', 
                        label: this.$t('forms.labels.category'),
                        type: 'icon-select', 
                        placeholder: this.$t('forms.labels.category'),
                        defaultValue: 4,
                        options: [
                            { fileName: 'iconaBianca.png', value: 4, label: this.$t('forms.labels.none') },
                            { fileName: 'meetInPerson.png', value: 2, label: 'Meet in Person' },
                            { fileName: 'dollar.png', value: 5, label: 'Request for quote' },
                            { fileName: 'phoneCall.png', value: 1, label: 'Phone Call' },
                            { fileName: 'videoCall.png', value: 3, label: 'Video Call' }
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
            newEntity.archived = false;
            
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
            newEntity.duration = 15; // Default 15 minutes
            newEntity.idEventCategory = 1; // Phone call category
            newEntity.description = '';
            newEntity.idEventStatus = 1;
            newEntity.idEventOutcome = 1;
            newEntity.title = this.$t('forms.labels.recallAction');

            this.entityModalConfig = {
                title: `${this.$t('forms.forms.createEvent') || 'Create Event'} - Phone Call`,
                restModuleName: 'events',
                viewerRef: 'eventsViewer',
                entity: newEntity,
                fieldDefinitions: [
                    { name: 'idCompany', label: this.$t('forms.labels.company'), type: 'number', editable: false, visible: false },
                    { name: 'idEventStatus', label: '', type: 'number', editable: false, visible: false, defaultValue: 1 },
                    { name: 'idEventOutcome', label: '', type: 'number', editable: false, visible: false, defaultValue: 1 },
                    { name: 'date', label: this.$t('forms.labels.date'), type: 'datetime', editable: true, visible: true },
                    { name: 'duration', label: this.$t('forms.labels.duration'), type: 'number', editable: true, visible: true },
                    { name: 'title', label: this.$t('forms.labels.title'), type: 'text', editable: true, visible: true },
                    { 
                        name: 'idEventCategory', 
                        label: this.$t('forms.labels.category'),
                        type: 'icon-select', 
                        defaultValue: 1,
                        options: [
                            { fileName: 'phoneCall.png', value: 1, label: 'Phone Call' },
                            { fileName: 'meetInPerson.png', value: 2, label: 'Meet in Person' },
                            { fileName: 'videoCall.png', value: 3, label: 'Video Call' },
                            { fileName: 'iconaBianca.png', value: 4, label: this.$t('forms.labels.none') },
                            { fileName: 'dollar.png', value: 5, label: 'Request for quote' }
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

        // pointer drag
        startDrag(targetRefName, shrinkRefName, evt) {
            try {
                if (evt && evt.currentTarget &&
                    typeof evt.currentTarget.setPointerCapture === 'function') {
                    evt.currentTarget.setPointerCapture(evt.pointerId);
                }
            } catch (e) { /* ignore */ }

            this._pointerId = evt && evt.pointerId ? evt.pointerId : null;
            this._dragging = true;
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

                // update stored numeric heights used by children (measure actual sections if present)
                // if we changed top container, measure its children; otherwise update the two refs directly
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
        },

        _onPointerUp(evt) {
            if (this._pointerId !== null && evt && evt.pointerId !== undefined && evt.pointerId !== this._pointerId) return;
            this._dragging = null;
            // clear cached refs
            this._stretchTargetName = null;
            this._shrinkTargetName = null;
            this._stretchTarget = null;
            this._shrinkTarget = null;
            this._pointerId = null;
            this._lastY = null;
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

.dashboard-layout {
    display: flex;
    height: calc(100vh - var(--page-header-height, 100px));
    width: 100%;
    overflow: hidden;
    align-items: stretch;
}

.company-data {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    min-height: 0; /* critical for inner scrolling */
    min-width: 65%;  /* allow this flex child to shrink and prevent overflow */
    width: 65%;
    /* max-width: 1300px; keep previous cap */
}
.companies-and-events {
    display: flex;
    gap: 8px;
    min-height: 0;
    height: 100%;
    width: 100%;
    align-items: stretch;
}

/* make each top section stretch to container height so changing the container affects them */
.companies-and-events > section {
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

/* make each section a flexible child and allow inner scroll/ellipsis */
.companies-block,
.events-block {
  flex: 1 1 0;
  min-height: 0;
  box-sizing: border-box;
  padding: 2px
}

/* right sidebar fixed width */
.sidebar {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    min-width: 35%;  /* allow this flex child to shrink and prevent overflow */
    width: 35%;
    box-sizing: border-box;
    border-left: 1px solid rgba(0,0,0,0.04); /* subtle separator if desired */
    background: transparent;
}

.dashboard-block {
    min-height: 0;
    box-sizing: border-box;
    /* allow inner viewer to show its own scrollbars — don't create section scrollbars */
    overflow: visible;

}

.companies-block {
    min-height: 160px;
}

.branches-block {
    min-height: 120px;
}

.persons-block {
    min-height: 120px;
}

.reports-block {
    height: 100%;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    /* min-height: 200px; */
}
.reports-block textarea {
  height: 100% !important;
  min-height: 0;
  resize: none !important;
  box-sizing: border-box;
  overflow: auto;
  display: block;
}
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
}

.divider:hover {
    background: rgba(0, 0, 0, 0.04);
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