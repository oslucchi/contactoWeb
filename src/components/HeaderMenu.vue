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
            <li role="none"><router-link role="menuitem" :to="{ name: 'MasterProjects' }" @click.native="closeAll">Projects</router-link></li>
            <li role="none"><router-link role="menuitem" :to="{ name: 'MasterEmployees' }" @click.native="closeAll">Employees</router-link></li>
          </ul>
        </li>

        <li role="none"><router-link role="menuitem" :to="{ name: 'Other link' }" @click.native="closeAll">Other link</router-link></li>
        
        <li role="none" class="user-section">
          <div class="user-info">
            <span class="user-name">{{ currentUser ? currentUser.username : 'User' }}</span>
          </div>
        </li>
        
        <li role="none">
          <button class="logout-btn" @click="handleLogout" role="menuitem">
            Logout
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'HeaderMenu',
  data() {
    return {
      open: false,
      subOpen: { master: false }
    };
  },
  computed: {
    ...mapGetters('auth', ['currentUser', 'isAuthenticated'])
  },
  mounted() {
    document.addEventListener('click', this.handleDocClick);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocClick);
  },
  methods: {
    ...mapActions('auth', ['logout']),
    handleDocClick(e) {
      if (!this.$el.contains(e.target)) this.closeAll();
    },
    toggleMenu() { this.open = !this.open; if (!this.open) this.closeAllSubs(); },
    toggleSub(key) { this.$set(this.subOpen, key, !this.subOpen[key]); },
    closeAllSubs() { Object.keys(this.subOpen).forEach(k => this.$set(this.subOpen, k, false)); },
    closeAll() { this.open = false; this.closeAllSubs(); },
    async handleLogout() {
      await this.logout();
      this.closeAll();
      this.$router.push({ name: 'Login' });
    }
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
  background: #fff !important;
  border: 1px solid rgba(0,0,0,0.15);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 9999;
  min-width: 200px;
  border-radius: 4px;
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
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
}
.menu-list a:hover, .menu-list button.sub-toggle:hover { background:#f5f5f5; }
.sub-list { list-style:none; margin:6px 0 6px 8px; padding:0; border-left:1px dashed rgba(0,0,0,0.04); }
.sub-list li { padding:4px 6px; }
.sub-list a {
  display:block;
  padding:6px 8px;

.user-section {
  border-top: 1px solid #e0e0e0;
  margin-top: 8px;
  padding-top: 8px !important;
}

.user-info {
  padding: 8px 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.logout-btn {
  display: block;
  width: 100%;
  padding: 8px 6px;
  color: #d32f2f;
  text-decoration: none;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  font-weight: 600;
}

.logout-btn:hover {
  background: #ffebee;
}
  color:#222;
  text-decoration:none;
  font-size: 14px;
  font-family: inherit;
}
.sub-list a:hover { background:#f5f5f5; }
</style>