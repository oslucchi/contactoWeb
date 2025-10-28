<template>
  <div id="app">
    <div class="page-header">
      <div id="logo" class="logo">
        <img alt="Contacto" 
             src="@/assets/icons/contacto.png" 
             style="border: 1px blue"
        />
        <span>{{ $t('header.tagline') }}</span>
      </div>

      <!-- page title -->
      <div class="page-title" v-if="pageTitle">{{ pageTitle }}</div>

      <div class="header-right">
        <LanguageSelector />
        <button class="menu-icon" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  <!--
      <div id="header" class="header" >
        <img alt="Contacto" src="@/assets/icons/contacto.png" style="height: 40px; margin-right: 10px;" />
      </div>
  -->
    <div id="main" class="app-content">
      <router-view/>
    </div>
  </div>
</template>

<script>
import LanguageSelector from '@/components/LanguageSelector.vue'

export default {
  name: 'contactoWeb',
  components: {
    LanguageSelector
  },
  computed: {
      pageTitle() {
      // prefer route meta.titleKey for i18n, fallback to title or route.name
      if (this.$route && this.$route.meta && this.$route.meta.titleKey) {
        return this.$t(this.$route.meta.titleKey);
      }
      return (this.$route && (this.$route.meta && this.$route.meta.title)) || this.$route.name || '';
    }
  },

  watch: {
    // update browser tab title on route change
    '$route'(to) {
      this.updateDocumentTitle(to);
    },
    // update document title when language changes
    '$i18n.locale'() {
      this.updateDocumentTitle(this.$route);
    }
  },
  
  methods: {
    updateDocumentTitle(route) {
      let title = 'Contacto';
      if (route && route.meta && route.meta.titleKey) {
        title = this.$t(route.meta.titleKey);
      } else if (route && route.meta && route.meta.title) {
        title = route.meta.title;
      } else if (route && route.name) {
        title = route.name;
      }
      document.title = title + ' - Contacto';
    }
  },
  
  created() {
    // initialize document.title
    this.updateDocumentTitle(this.$route);
  }
}
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;           /* remove default page margin */
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  flex-direction: column;
  --page-header-height: 100px; /* expose header height so routed views can use the variable reliably */
}

.page-header {
    position: relative;
    height: 100px;
    --page-header-height: 100px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 1;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.page-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: calc(100% - 240px); /* reserve space for logo + menu (adjust if needed) */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  user-select: none;
  margin: 0;
  z-index: 3;
  font-size: 40px;
  font-style: italic;
}

.logo {
    display: flex;
    flex-direction: column;   /* stack vertically */
    align-items: center;      /* center horizontally */
    justify-content: center;  /* center vertically inside the header area */
    gap: 0;                   /* zero gap between img and span */
    padding: 4px 4px;         /* moved from inline style */
    box-sizing: border-box;
    border: 1px solid transparent;
}

.logo img {
    height: 80px;
}
.logo span {
    font-weight: bold;
    font-size: 12px;
    font-style: italic;
    color: darkgreen;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.menu-icon {
    background: none;
    border: none;
    margin-left: 16px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 32px;
    width: 32px;
    padding: 0;
    border: 1px red;
}

.menu-icon span {
    display: block;
    height: 4px;
    width: 24px;
    background: #333;
    margin: 3px 0;
    border-radius: 2px;
}

.app-content {
  flex: 1 1 auto;
  min-height: 0; /* allow children to shrink inside flex */
  overflow: hidden;
  padding-bottom: 10px;
}
</style>