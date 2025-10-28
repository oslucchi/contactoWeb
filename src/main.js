import Vue from 'vue';
import App from './App.vue';
import router from './router';
import i18n from './locales';
import LookupData from './services/LookupDataInitializer';
import { setupAxiosInterceptor, setI18nInstance } from './config/axiosConfig';

Vue.config.productionTip = false;

// Set up axios interceptor for language headers
setI18nInstance(i18n);
setupAxiosInterceptor();

new Vue({
  router,
  i18n,
  created() {
    LookupData.initialize();
  },
  render: h => h(App),
}).$mount('#app');