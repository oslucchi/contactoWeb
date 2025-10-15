<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/DashboardByCompany.vue -->
<template>
    <div class="dashboard-layout">
        <div class="main-area">
            <!-- Top: Companies -->
            <section class="dashboard-block companies-block">
                <GenericDataViewer 
                    page="dashboard" 
                    element="Company" 
                    :user="userId"
                    :filter="{ searchFor: '' }"
                    :featuresEnabled="[false, false, false, true, true]"
                    @rowSelected="onCompanySelected" />
            </section>
            <section class="dashboard-block branches-block">
                <GenericDataViewer
                    page="dashboard"
                    element="Branch"
                    :user="userId"
                    :filter="companyFilter"
                    :featuresEnabled="[false, false, false, false, false]"
                />
            </section>
            <section class="dashboard-block persons-block">
                <GenericDataViewer
                    page="dashboard"
                    element="Person"
                    :user="userId"
                    :filter="companyFilter"
                    :featuresEnabled="[false, false, false, false, false]"
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
            
        };
    },
    methods: {
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
.dashboard-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
}

.main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 8px;
}

.dashboard-block {
    background: #f9f9f9;
    border-radius: 6px;
    min-height: 120px;
    overflow: auto;
    border: 1px solid black;
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