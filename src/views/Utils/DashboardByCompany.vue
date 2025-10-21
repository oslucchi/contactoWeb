<template>
    <div class="dashboard-layout">
        <div class="company-data" :style="{ width: '70%', maxWidth: '1300px' }">
            <!-- Companies -->
            <section ref="companiesSection" class="dashboard-block companies-block"
                :style="{ height: companiesHeight + 'px' }">
                <GenericDataViewer ref="companyViewer" page="dashboard" element="Company" :user="userId"
                    :filter="{ searchFor: '' }" :featuresEnabled="[false, false, false, true, true]"
                    :tableHeight="companiesHeight" :containerWidth="mainAreaWidth" @rowSelected="onCompanySelected" />
            </section>

            <!-- Divider -->
            <div class="divider" ref="divider1" @pointerdown.prevent="startDrag('companies-branches', $event)"></div>

            <!-- Branches -->
            <section ref="branchesSection" class="dashboard-block branches-block"
                :style="{ height: branchesHeight + 'px' }">
                <GenericDataViewer ref="branchViewer" page="dashboard" element="Branch" :user="userId"
                    :filter="companyFilter" :featuresEnabled="[false, false, false, false, false]"
                    :tableHeight="branchesHeight" :containerWidth="mainAreaWidth" @rowSelected="onBranchSelected" />
            </section>

            <!-- Divider -->
            <div class="divider" ref="divider2" @pointerdown.prevent="startDrag('branches-persons', $event)"></div>

            <!-- Persons -->
            <section ref="personsSection" class="dashboard-block persons-block"
                :style="{ height: personsHeight + 'px' }">
                <GenericDataViewer ref="personViewer" page="dashboard" element="Person" :user="userId"
                    :filter="companyFilter" :featuresEnabled="[false, false, false, false, false]"
                    :tableHeight="personsHeight" :containerWidth="mainAreaWidth" @rowSelected="onPersonSelected" />
            </section>
        </div>
    </div>
</template>

<script>
import GenericDataViewer from '@/views/Utils/GenericDataViewer.vue';

export default {
    components: { GenericDataViewer },
    data() {
        return {
            userId: 1,
            selectedCompany: null,
            selectedBranch: null,
            companyFilter: { id: -1 },
            branchFilter: { id: -1 },

            companiesHeight: 400,
            branchesHeight: 120,
            personsHeight: 240,

            // drag state
            _dragging: null,
            _pointerId: null,
            _lastY: null,            // <-- incremental approach
            minSectionHeight: 80,

            sidebarWidth: 400,
            mainAreaWidth: window.innerWidth - 400 - 10,
        };
    },
    mounted() {
        this._boundHandleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this._boundHandleResize);
        this.handleResize();
    },
    beforeDestroy() {
        if (this._boundHandleResize) window.removeEventListener('resize', this._boundHandleResize);
        this._removePointerListeners();
        if (this._rafPending) cancelAnimationFrame(this._rafPending);
    },
    methods: {
        handleResize() {
            this.mainAreaWidth = window.innerWidth - this.sidebarWidth - 10;
            this.$nextTick(() => this._callChildrenCalc());
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

        // pointer drag
        startDrag(pair, evt) {
            try {
                if (evt && evt.currentTarget &&
                    typeof evt.currentTarget.setPointerCapture === 'function') {
                    evt.currentTarget.setPointerCapture(evt.pointerId);
                }
            } catch (e) { /* ignore */ }

            this._pointerId = evt && evt.pointerId ? evt.pointerId : null;
            this._dragging = pair;
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

            const compRef = this.$refs.companiesSection;
            const branRef = this.$refs.branchesSection;
            const persRef = this.$refs.personsSection;

            const currCompanies = compRef ? compRef.getBoundingClientRect().height : Number(this.companiesHeight) || 0;
            const currBranches = branRef ? branRef.getBoundingClientRect().height : Number(this.branchesHeight) || 0;
            const currPersons = persRef ? persRef.getBoundingClientRect().height : Number(this.personsHeight) || 0;

            const minH = Number(this.minSectionHeight) || 0;

            if (this._dragging === 'companies-branches') {
                const a = Math.max(minH, Math.round(currCompanies + dy));
                const b = Math.max(minH, Math.round(currBranches - dy));
                if (compRef) compRef.style.height = a + 'px';
                if (branRef) branRef.style.height = b + 'px';
                this.companiesHeight = a;
                this.branchesHeight = b;
            } else if (this._dragging === 'branches-persons') {
                const b = Math.max(minH, Math.round(currBranches + dy));
                const p = Math.max(minH, Math.round(currPersons - dy));
                if (branRef) branRef.style.height = b + 'px';
                if (persRef) persRef.style.height = p + 'px';
                this.branchesHeight = b;
                this.personsHeight = p;
            }

            this._callChildrenCalc();
        },

        _onPointerUp(evt) {
            if (this._pointerId !== null && evt && evt.pointerId !== undefined && evt.pointerId !== this._pointerId) return;
            this._dragging = null;
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
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

.company-data {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
}

.dashboard-block {
    box-sizing: border-box;
    /* allow inner viewer to show its own scrollbars — don't create section scrollbars */
    overflow: visible;
    /* was overflow-y: auto; overflow-x: hidden; */
    /* keep any optional visual separation lighter or removed */
    border-right: none;
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