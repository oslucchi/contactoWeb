<template>
  <nav class="header-menu" @keydown.esc="closeAll">
    <button class="menu-toggle" @click="toggleMenu" :aria-expanded="open" aria-haspopup="true" aria-label="Main menu">
      ☰
    </button>

    <div v-if="open" class="menu-popover" role="menu">
      <ul class="menu-list">
        <li role="none">
          <router-link role="menuitem" :to="{ name: 'DashboardByCompany' }" @click.native="closeAll">Dashboard by Company</router-link>
        </li>
        <li role="none">
          <router-link role="menuitem" :to="{ name: 'DashboardByProject' }" @click.native="closeAll">Dashboard by Project</router-link>
        </li>

        <li class="has-sub" role="none">
          <button class="sub-toggle" @click="toggleSub('master')" :aria-expanded="subOpen.master">Master data</button>
          <ul v-if="subOpen.master" class="sub-list" role="menu">
            <li role="none"><router-link role="menuitem" :to="{ name: 'MasterCompany' }" @click.native="closeAll">Company</router-link></li>
            <li role="none"><router-link role="menuitem" :to="{ name: 'MasterEvents' }" @click.native="closeAll">Events</router-link></li>
            <li role="none"><router-link role="menuitem" :to="{ name: 'MasterPersons' }" @click.native="closeAll">Persons</router-link></li>
          </ul>
        </li>

        <li role="none"><router-link role="menuitem" :to="{ name: 'OtherView' }" @click.native="closeAll">Other view</router-link></li>
      </ul>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'HeaderMenu',
  data() {
    return {
      open: false,
      subOpen: { master: false }
    };
  },
  methods: {
    toggleMenu() { this.open = !this.open; if (!this.open) this.closeAllSubs(); },
    toggleSub(key) { this.$set(this.subOpen, key, !this.subOpen[key]); },
    closeAllSubs() { Object.keys(this.subOpen).forEach(k => this.$set(this.subOpen, k, false)); },
    closeAll() { this.open = false; this.closeAllSubs(); }
  },
  mounted() {
    document.addEventListener('click', this.handleDocClick);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocClick);
  },
  methods: {
    handleDocClick(e) {
      if (!this.$el.contains(e.target)) this.closeAll();
    },
    toggleMenu() { this.open = !this.open; if (!this.open) this.closeAllSubs(); },
    toggleSub(key) { this.$set(this.subOpen, key, !this.subOpen[key]); },
    closeAllSubs() { Object.keys(this.subOpen).forEach(k => this.$set(this.subOpen, k, false)); },
    closeAll() { this.open = false; this.closeAllSubs(); }
  }
};
</script>

<style scoped>
.header-menu { position: relative; display:inline-block; }
.menu-toggle {
  background:none;
  border:1px solid transparent;
  padding:6px 8px;
  cursor:pointer;
  font-size:18px;
  line-height:1;
  border-radius:4px;
}
.menu-popover {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  z-index: 50;
  min-width: 200px;
}
.menu-list { list-style:none; margin:0; padding:8px 0; }
.menu-list li { padding:0 12px; }
.menu-list a, .menu-list button.sub-toggle {
  display:block;
  padding:8px 6px;
  color:#222;
  text-decoration:none;
  border:0;
  background:transparent;
  width:100%;
  text-align:left;
}
.menu-list a:hover, .menu-list button.sub-toggle:hover { background:#f5f5f5; }
.sub-list { list-style:none; margin:6px 0 6px 8px; padding:0; border-left:1px dashed rgba(0,0,0,0.04); }
.sub-list li { padding:4px 6px; }
</style>