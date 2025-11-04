<template>
    <div class="dashboard-layout">
        <div class="upper-zone" ref="upperZone">
            <!--
            <div class="projects-area" ref ="projectsRelatedData">
            -->
            <section 
                    ref="projectsSection" 
                    class="projects-block"
            >
                <GenericDataViewer 
                    ref="projectViewer" 
                    page="dashboardProjects" 
                    element="Project" 
                    :user="userId"
                    :filter="projectSearchFilter"
                    :featuresEnabled="[false, false, false, true, true]"
                    :tableHeight="projectsHeight" 
                    :containerWidth="mainAreaWidth" 
                    @rowSelected="onProjectSelected" />
            </section>
            <section 
                    ref="projectDescriptionSection" 
                    class="projectDescription-block"
            >
                <span>
                    {{ prescriptionTitle }}
                </span>
                <textarea
                        :value="selectedProject ? selectedProject.description : ''"
                        :placeholder="projectPlaceholder"
                >
                </textarea>
            </section>
            <section 
                    ref="companiesSection" 
                    class="companies-block"
            >
                <GenericDataViewer 
                    ref="companyViewer" 
                    page="dashboardProjects" 
                    element="Company" 
                    :user="userId"
                    :filter="companySearchFilter"
                    :featuresEnabled="[false, false, false, true, true]"
                    :tableHeight="projectsHeight" 
                    :containerWidth="mainAreaWidth" 
                    @rowSelected="onCompanySelected" />
            </section>
            <section 
                    ref="personsSection" 
                    class="persons-block"
            >
                <GenericDataViewer 
                    ref="personViewer" 
                    page="dashboardProjects" 
                    element="Person" 
                    :user="userId"
                    :filter="personSearchFilter" 
                    :featuresEnabled="[false, false, false, true, false]"
                    :tableHeight="projectsHeight" 
                    :containerWidth="mainAreaWidth" />
            </section>
        </div>
        <!-- Divider -->
        <div class="divider" ref="divider1" @pointerdown.prevent="startDrag('upper-zone','lower-zone', $event)"></div>
        <div class="lower-zone" ref ="lowerZone">
            <section ref="eventsSection" 
                    class="events-block"
            >
                <GenericDataViewer 
                    ref="eventsViewer" 
                    page="dashboardProjects" 
                    element="Event" 
                    :user="userId"
                    :filter="eventsFilter"
                    :featuresEnabled="[false, false, false, true, true]"
                    :tableHeight="eventsHeight" 
                    :containerWidth="mainAreaWidth" 
                    @rowSelected="onEventSelected" />
            </section>

            <section 
                    ref="reportsSection" 
                    class="reports-block"
            >
                <GenericDataViewer 
                    ref="reportsViewer" 
                    page="dashboardProjects" 
                    element="Report" 
                    :user="userId"
                    :filter="reportsFilter"
                    :featuresEnabled="[false, false, false, false, false]"
                    :tableHeight="eventsHeight" 
                    :containerWidth="mainAreaWidth" 
                />
                <textarea
                        :value="selectedReport ? selectedReport.report : ''"
                        :placeholder="projectPlaceholder"
                >
                </textarea>
            </section>
        </div>
<!--
        </div>
-->
    </div>
</template>

<script>
import GenericDataViewer from '@/views/Utils/GenericDataViewer.vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import dayjs from 'dayjs';
import i18n from '@/locales'; // <-- import the i18n instance you exported


export default {
    components: { GenericDataViewer },
    data() {
        return {
            projectSearchFilter: { },
            companySearchFilter: { id: 0 },
            eventsFilter: { id: 0 },
            reportsFilter: { id: 0 },

            personSearchFilter: { listOfIds: '' },
            // reactive state used by the template / handlers
            selectedReport: null,
            selectedReportOriginalContent: '',
            selectedEvent: null,
            selectedBranch: null,

            selectedProject: null,
            selectedCompany: null,

            userId: 1,

            projectsHeight: 400,
            eventsHeight: 400,

            // drag state
            _dragging: null,
            _pointerId: null,
            _lastY: null,            // <-- incremental approach
            minSectionHeight: 80,

            mainAreaWidth: 0,

            _stretchTargetName: null,
            _shrinkTargetName: null,
            _stretchTarget: null,
            _shrinkTarget: null,
        };
    },

    computed: {
        // use this.$t if vue-i18n was injected into Vue root, otherwise call the imported instance
        projectPlaceholder() {
            return (typeof this.$t === 'function')
                ? this.$t('forms.placeholders.projectDescription')
                : i18n.t('forms.placeholders.projectDescription');
        },

        prescriptionTitle() {
            return (typeof this.$t === 'function')
                ? this.$t('forms.placeholders.prescription')
                : i18n.t('forms.placeholders.prescription');
        }
    },

    mounted() {
        this._boundHandleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this._boundHandleResize);

        // measure initial sizes and observe sidebar for changes
        this.$nextTick(() => {
            this.handleResize();
        });
    },
    beforeDestroy() {
        if (this._boundHandleResize) window.removeEventListener('resize', this._boundHandleResize);
        this._removePointerListeners();
        if (this._rafPending) cancelAnimationFrame(this._rafPending);
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
            // small gutter of 10px preserved as before
            this.mainAreaWidth = Math.max(0, Math.round(containerWidth - 10));
            this.$nextTick(() => this._callChildrenCalc());
        },

        async onProjectSelected(payload) {
            const id = payload && payload.id ? payload.id : null;
            console.log('project selected', payload);
            this.selectedProject = payload && payload.item ? payload.item : null;

            // ensure stable filter objects (mutate, do not replace) so child watchers react correctly
            if (!this.companySearchFilter || typeof this.companySearchFilter !== 'object') {
                this.companySearchFilter = { id: -1 };
            }
            // if (!this.personSearchFilter || typeof this.personSearchFilter !== 'object') {
            //     this.personSearchFilter = { listOfIds: '' };
            // }
            const projectId = this.selectedProject
              ? (this.selectedProject.idProject != null ? this.selectedProject.idProject : (this.selectedProject.id != null ? this.selectedProject.id : -1))
              : -1;
            this.companySearchFilter.id = projectId;
            this.eventsFilter.id = projectId;

            // also clear selectedCompany and apply person filter reset (or narrow persons by project if desired)
            this.selectedCompany = null;
            this.selectedEvent = null;

            // reload companies then build person filter from selected company ids and reload persons
            try {
              const compRef = this.$refs.companyViewer;
              // call reload if available (may return a Promise)
              if (compRef && typeof compRef.reloadData === 'function') {
                // await completion if it returns a promise
                const p = compRef.reloadData();
                if (p && typeof p.then === 'function') {
                  await p;
                }
              } else if (compRef && typeof compRef.calculateTableDimensions === 'function') {
                // fallback: force recalculation
                compRef.calculateTableDimensions();
              }

              // allow Vue to finish rendering the company viewer
              await this.$nextTick();

              // extract company ids from the loaded dataset (not from selection)
              const getCompanyIdFromItem = item => {
                if (!item) return null;
                if (item.idCompany != null) return String(item.idCompany);
                if (item.companyId != null) return String(item.companyId);
                if (item.id != null) return String(item.id);
                return null;
              };

              let source = [];
              // prefer an internal unfiltered source if the viewer exposes it
              if (compRef && Array.isArray(compRef._itemsSource) && compRef._itemsSource.length) {
                source = compRef._itemsSource;
              } else if (compRef && Array.isArray(compRef.items) && compRef.items.length) {
                source = compRef.items;
              } else {
                // fallback: try to read rows from rendered DOM only if needed
                source = [];
              }

              const ids = source.map(getCompanyIdFromItem).filter(v => v);
              // apply person filter as comma-separated list (server expects "listOfIds=1,2,3")
              if (!this.personSearchFilter || typeof this.personSearchFilter !== 'object') this.personSearchFilter = { listOfIds: '' };
              this.personSearchFilter.listOfIds = ids.length ? ids.join(',') : '';

              // now reload persons viewer
              const persRef = this.$refs.personViewer;
              if (persRef && typeof persRef.reloadData === 'function') {
                const pp = persRef.reloadData();
                if (pp && typeof pp.then === 'function') await pp;
              } else if (persRef && typeof persRef.calculateTableDimensions === 'function') {
                persRef.calculateTableDimensions();
              }
            } catch (e) {
              console.warn('company/person refresh failed', e);
            }
         },

        onCompanySelected(payload) {
            const id = payload && payload.id ? payload.id : null;
            this.selectedCompany = payload && payload.item ? payload.item : null;
            this.companyFilter = id ? { id } : { id: -1 };

            if (id) {
                this.branchFilter = { idCompany: id, companyId: id };
            } else {
                this.branchFilter = { id: -1 };
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
                } catch (e) {
                    console.warn('person refresh failed', e);
                }
            });
        },

        onEventSelected(payload) {
            const id = payload && payload.id ? payload.id : null;
            this.selectedEvent = payload && payload.item ? payload.item : null;
            const eventId = this.selectedEvent
              ? (this.selectedEvent.idEvent != null ? this.selectedEvent.idEvent : (this.selectedEvent.idEvent != null ? this.selectedEvent.idEvent : 0))
              : -1;
            this.reportsFilter.id = eventId;
            this.selectedReport = null;
            console.log(`reportFilter ${JSON.stringify(this.reportsFilter)}`);
            this.$nextTick(() => {
                if (this.$refs.reportsViewer && typeof this.$refs.reportsViewer.reloadData === 'function') {
                    this.$refs.reportsViewer.reloadData();
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
                if (this._stretchTargetName === 'upper-zone') {
                    const upperRef = this.$refs.upperZone;
                    const lowerZone = this.$refs.lowerZone;
                    if (upperRef) this.projectsHeight = Math.round(upperRef.getBoundingClientRect().height);
                    if (lowerZone) this.eventsHeight = Math.round(lowerZone.getBoundingClientRect().height);
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
    display: flex 1 1;
    height: calc(100vh - var(--page-header-height, 100px));
    width: 100%;
    overflow: hidden;
    align-items: stretch;
}

.dashboard-block {
    min-height: 0;
    box-sizing: border-box;
    overflow: visible;
}

.upper-zone {
    display: flex;
    gap: 8px;
    min-height: 0;
    height: 35%;
    width: 100%;
    align-items: stretch;
}

.upper-zone .top-row-placeholder {
  height: 35%;
  min-height: 0;
}

.upper-zone > .projects-block,
.upper-zone > .projectDescription-block,
.upper-zone > .companies-block,
.upper-zone > .persons-block {
  display: inline-flex; 
  align-items: stretch;
  min-height: 0;
  box-sizing: border-box;
    border: 2px solid rgba(0, 0, 0, 0.25);
}

/* keep the same sizes assigned previously */
.upper-zone > .projects-block { width: 35% !important; }
.upper-zone > .companies-block { width: 20% !important; }
.upper-zone > .persons-block { width: 20% !important; }
.upper-zone > .projectDescription-block { 
  display: flex;
  flex-direction: column; /* stack span and textarea vertically */
  align-items: stretch;
  justify-content: flex-start;
  box-sizing: border-box;
  width: 23% !important;
}
.upper-zone >.projectDescription-block span {
    display: block;
    width: 100%;
    text-align: end;
    font-size: 1.5rem;
    color: rgb(114, 173, 69);
    padding-right: 8px;
}
.upper-zone >.projectDescription-block textarea {
  flex: 1 1 auto;
  min-height: 0;        /* critical in flex children to enable proper shrinking */
  height: auto;         /* let flex control height */
  resize: none !important;
  overflow: auto;
  display: block;
  font-size: 1rem;

  /* visual adjustments */
  border: none;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 8px;
  box-sizing: border-box;
  border-radius: inherit;
}

.lower-zone {
    display: flex;
    gap: 8px;
    min-height: 0;
    height: 60%;
    width: 100%;
    align-items: stretch;
}

.lower-zone > section {
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
}

.events-block {
    width: 25%;
    border: 2px solid rgba(0, 0, 0, 0.25);
}

.reports-block{
    width: 74%;
    border: 2px solid rgba(0, 0, 0, 0.25);
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

</style>