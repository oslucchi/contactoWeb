<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/DashboardByCompany.vue -->
<template>
    <div class="dashboard-layout">
        <div class="company-data" :style="{ width: '70%', maxWidth: '1300px'}">
            <!-- Top: Companies -->
            <section class="dashboard-block companies-block"
                     :style="{ maxHeight: '400px', height: '400px' }">
                <GenericDataViewer 
                    page="dashboard" 
                    element="Company" 
                    :user="userId"
                    :filter="{ searchFor: '' }"
                    :featuresEnabled="[false, false, false, true, true]"
                    :tableHeight=400
                    :emitOnSelect="companySelected"
                    @rowSelected="onCompanySelected" />
            </section>
                    <!-- :containerWidth="mainAreaWidth" -->

            <section class="dashboard-block branches-block"
                    :style="{ maxHeight: '120px', height: '120px' }">
                <GenericDataViewer
                    page="dashboard"
                    element="Branch"
                    :user="userId"
                    :filter="companyFilter"
                    :featuresEnabled="[false, false, false, false, false]"
                    :tableHeight=120
                    :emitOnSelect="branchSelected"
                    @rowSelected="onBranchSelected" />
            </section>
            <section class="dashboard-block persons-block"
                    :style="{ maxHeight: '240px', height: '240px' }">

                <GenericDataViewer
                    page="dashboard"
                    element="Person"
                    :user="userId"
                    :filter="companyFilter"
                    :featuresEnabled="[false, false, false, false, false]"
                    :tableHeight=240
                    :emitOnSelect="personSelected"
                    @rowSelected="onPersonSelected" />
            </section>
    <!--
      <section class="dashboard-block projects-block">
        <GenericDataViewer
          page="dashboard"
          element="project"
          :user="userId"
          :filter="companyFilter"
        />
      </section>
      -->
        </div>
        <!-- 
    <aside class="events-block">
      <GenericDataViewer
        page="dashboard"
        element="event"
        :user="userId"
        :filter="companyFilter"
      />
    </aside>
Right: Events -->
    </div>
</template>

<script>
import GenericDataViewer from '@/views/Utils/GenericDataViewer.vue';

export default {
    components: {
        GenericDataViewer
    },
    data() {
        return {
            userId: 1, // Replace with actual user logic
            selectedCompany: null,
            companyFilter: { id: -1 } ,
            branchFilter: { id: -1 },
            sidebarWidth: 400,
            mainAreaWidth: window.innerWidth - 400 - 10
        };
    },
    mounted() {
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);
    },
    methods: {
        handleResize() {
            this.mainAreaWidth = window.innerWidth - this.sidebarWidth - 10;
        },

        // payload is the structured object emitted by GenericDataViewer:
        // { element, idField, id, item }
        onCompanySelected(payload) {
            console.log('onCompanySelected payload:', payload);
            const id = payload && payload.id ? payload.id : null;
            this.selectedCompany = payload ? payload.item : null;
            this.companyFilter = id ? { id } : { id: -1 };

            // reset branch/person selection
            this.selectedBranch = null;
            this.branchFilter = { id: -1 };
            console.log('called onCompanySelected:', this.selectedCompany);
        },

        onBranchSelected(payload) {
            const id = payload && payload.id ? payload.id : null;
            this.selectedBranch = payload ? payload.item : null;
            this.branchFilter = id ? { id } : { id: -1 };
        },

    },
}
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
}

/* SECTION is the hard boundary (optional but helpful) */
.dashboard-block {
  box-sizing: border-box;
  overflow: hidden; /* prevents “bleed” outside its own max width/height */
}

/*
.dashboard-block {
    width: 100%;   
    box-sizing: border-box;
    border-radius: 6px;
    border: 1px solid #ccc;
    overflow: hidden;

    max-height: 320px;
    height: 320px; 
    min-width: 320px;
    position: relative;
    background: #f9f9f9;
}
*/

.companies-block {
    min-height: 160px;
}

.branches-block {
    min-height: 120px;
}

.persons-block {
    min-height: 120px;
}

.projects-block {
    min-height: 120px;
}

.events-block {
    width: 320px;
    min-width: 220px;
    background: #fffbe6;
    border-left: 2px solid #eee;
    padding: 8px;
    overflow-y: auto;
    height: 100vh;
}
</style>