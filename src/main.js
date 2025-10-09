import Vue from 'vue';
import App from './App.vue';
import router from './router';
import LookupData from './services/LookupDataInitializer';

Vue.config.productionTip = false;

new Vue({
  router,
  created() {
    LookupData.initialize();
  },
  render: h => h(App),
}).$mount('#app');