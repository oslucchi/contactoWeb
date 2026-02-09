<!-- filepath: /share/sources/Contacto/cantactoWeb/src/views/MasterDataHandlers/Persons/PersonsList.vue -->
<template>
  <div class="persons-layout">
    <div class="persons-content">
      <GenericDataViewer 
        ref="personsViewer" 
        page="masterDataDashboard" 
        element="Person" 
        :user="userId"
        :filter="searchFilter"
        :featuresEnabled="[true, true, true, true, true]"
        :tableHeight="tableHeight" 
        :containerWidth="containerWidth"
        @rowSelected="onRowSelected"
        @addItem="onAddPerson"
        @deleteItem="onDeletePerson"
      />
    </div>
  </div>
</template>

<script>
import GenericDataViewer from '@/views/Utils/GenericDataViewer.vue';
import { mapGetters } from 'vuex';

export default {
  components: {
    GenericDataViewer
  },
  data() {
    return {
      searchFilter: { searchFor: '' },
      selectedPerson: null,
      tableHeight: 600,
      containerWidth: 1400
    };
  },
  computed: {
    ...mapGetters('auth', ['userId']),
  },
  mounted() {
    this.$nextTick(() => {
      this.calculateDimensions();
    });
    window.addEventListener('resize', this.calculateDimensions);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.calculateDimensions);
  },
  methods: {
    calculateDimensions() {
      // Get the actual content area dimensions
      const contentEl = this.$refs.personsViewer && this.$refs.personsViewer.$el;
      if (contentEl && contentEl.parentElement) {
        const parentWidth = contentEl.parentElement.offsetWidth;
        const parentHeight = contentEl.parentElement.offsetHeight;
        
        // Set container width to available width (viewport minus padding)
        // The GenericDataViewer will show horizontal scroll if DB column widths exceed this
        this.containerWidth = Math.max(800, parentWidth - 40);
        
        // Calculate available height for table
        const headerHeight = 200;
        this.tableHeight = Math.max(400, window.innerHeight - headerHeight);
      } else {
        // Fallback when refs not ready
        this.containerWidth = Math.max(800, window.innerWidth - 100);
        this.tableHeight = Math.max(400, window.innerHeight - 200);
      }
    },
    onRowSelected(payload) {
      this.selectedPerson = payload && payload.item ? payload.item : null;
      console.log('Selected person:', this.selectedPerson);
    },
    onAddPerson() {
      // GenericDataViewer will emit this when add button is clicked
      // The viewer handles the actual creation through its configuration
      console.log('Add person triggered');
    },
    onDeletePerson(payload) {
      // GenericDataViewer will emit this when delete button is clicked
      // The viewer handles the actual deletion through its configuration
      console.log('Delete person triggered', payload);
    }
  },
  watch: {
    containerWidth(val) {
      console.log('Container width:', val);
    },
    tableHeight(val) {
      console.log('Table height:', val);
    }
  }
}
</script>

<style scoped>
.persons-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #fff;
  overflow: hidden;
  box-sizing: border-box;
}

.persons-content {
  flex: 1;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}
</style>