import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './locales';
import LookupData from './services/LookupDataInitializer';
import { setupAxiosInterceptor, setI18nInstance } from './config/axiosConfig';
import '@/middleware/axiosInterceptors'; // Import auth interceptors

Vue.config.productionTip = false;

// Set up axios interceptor for language headers
setI18nInstance(i18n);
setupAxiosInterceptor();

// Restore authentication session before mounting app
store.dispatch('auth/restoreSession').then(() => {
  new Vue({
    router,
    store,
    i18n,
    created() {
      LookupData.initialize();
    },
    render: h => h(App),
  }).$mount('#app');
});