<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/DashboardByCompany.vue -->
<template>
    <div class="dashboard-layout">
        <div class="main-area" :style="{ width: mainAreaWidth + 'px' }">
            <!-- Top: Companies -->
            <section class="dashboard-block companies-block"
                     :style="{ maxHeight: '200px', height: '200px' }">
                <GenericDataViewer 
                    page="dashboard" 
                    element="Company" 
                    :user="userId"
                    :filter="{ searchFor: '' }"
                    :featuresEnabled="[false, false, false, true, true]"
                    :tableHeight=200
                    :containerWidth="mainAreaWidth"
                    @rowSelected="onCompanySelected" />
            </section>
            <section class="dashboard-block branches-block"
                    :style="{ maxHeight: '120px', height: '120px' }">

                <GenericDataViewer
                    page="dashboard"
                    element="Branch"
                    :user="userId"
                    :filter="companyFilter"
                    :featuresEnabled="[false, false, false, false, false]"
                    :tableHeight=120
                    :containerWidth="mainAreaWidth"
                />
            </section>
            <section class="dashboard-block persons-block"
                    :style="{ maxHeight: '120px', height: '120px' }">

                <GenericDataViewer
                    page="dashboard"
                    element="Person"
                    :user="userId"
                    :filter="companyFilter"
                    :featuresEnabled="[false, false, false, false, false]"
                    :tableHeight=120
                    :containerWidth="mainAreaWidth"
                    />
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
            companyFilter: null,
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
        onCompanySelected(company) {
            console.log('Selected company:', company.idCompany );
            this.selectedCompany = company;
            // You can pass any filter structure needed by your API
            this.companyFilter = company ? { id: company.idCompany } : null;
        }
    }
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

.main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.dashboard-block {
    width: 100%;   /* Or set a max-width if needed */
    box-sizing: border-box;
    border-radius: 6px;
    border: 1px solid #ccc;
    overflow: hidden;

    max-height: 320px;
    height: 320px; /* Example: adjust as needed or use JS to calculate */
    min-width: 320px;
    position: relative;
    background: #f9f9f9;
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