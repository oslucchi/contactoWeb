<template>
    <div class="dashboard-layout" >
        <div class="table-data-view">
            <section 
                    ref="dataSection" 
                    class="dataBlock"
            >
                <GenericDataViewer 
                    ref="masterDataTable" 
                    page="masterDataDashboard" 
                    :element="element" 
                    :user="userId"
                    :filter="searchFilter"
                    :featuresEnabled="[true, true, true, true, true]"
                    :tableHeight="tableHeight" 
                    :containerWidth="mainAreaWidth" 
                    @rowSelected="onRowSelected" />
            </section>
            </div>
    </div>
</template>

<script>
import GenericDataViewer from '@/views/Utils/GenericDataViewer.vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import dayjs from 'dayjs';

export default {
    components: { GenericDataViewer },
    data() {
        return {
            element: 'Person',
            searchFilter: { searchFor: '' },
            selectedRecord: null,
            userId: 1,

            tableHeight: 800,
            minSectionHeight: 80,

            mainAreaWidth: 1200,
        };
    },
    mounted() {
    },
    beforeDestroy() {
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

        onRowSelected(payload) {
            const id = payload && payload.id ? payload.id : null;
            this.selectedRecord = payload && payload.item ? payload.item : null;
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
    height: 100%;
    width: 100%;
    overflow: hidden;
    /* center the content horizontally and vertically */
    align-items: center;
    justify-content: center;
}

/* ensure the inner view doesn't force full stretch */
.table-data-view {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
}

/* ensure the inner view doesn't force full stretch */
.table-data-view {
  display: block;
  align-self: center;
  /* optional: constrain size so centering is visible */
  width: auto;
  max-width: 100%;
}

.dashboard-layout {
    display: flex;
    height: calc(100vh - var(--page-header-height, 100px));
    width: 100%;
    overflow: hidden;
    /* center the content horizontally and vertically */
    align-items: center;
    justify-content: center;
}

/* ensure the inner view doesn't force full stretch */
.table-data-view {
  display: block;
  align-self: center;
  /* optional: constrain size so centering is visible */
  width: auto;
  max-width: 100%;
}

.dashboard-block.companies-block {
  width: 100%;
  /* allow the internal viewer to size based on tableHeight */
  box-sizing: border-box;
}
</style>