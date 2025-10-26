<template>
  <div id="app">
    <div class="page-header">
      <div id="logo" class="logo">
        <img alt="Contacto" 
             src="@/assets/icons/contacto.png" 
             style="border: 1px blue"
        />
        <span>action manager at your fingertips</span>
      </div>

      <!-- page title -->
      <div class="page-title" v-if="pageTitle">{{ pageTitle }}</div>

      <button class="menu-icon" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
      </button>
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
export default {
  name: 'contactoWeb',
  computed: {
      pageTitle() {
      // prefer route meta.title, fallback to route.name or empty
      return (this.$route && (this.$route.meta && this.$route.meta.title)) || this.$route.name || '';
    }
  },

  watch: {
    // update browser tab title on route change
    '$route'(to) {
      const t = (to && to.meta && to.meta.title) ? to.meta.title : (to && to.name) ? to.name : 'Contacto';
      document.title = t + ' - Contacto';
    }
  },
  created() {
    // initialize document.title
    const t = (this.$route && this.$route.meta && this.$route.meta.title) ? this.$route.meta.title : (this.$route && this.$route.name) ? this.$route.name : 'Contacto';
    document.title = t + ' - Contacto';
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