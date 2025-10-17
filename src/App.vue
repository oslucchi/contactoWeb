<template>
  <div id="app">
    <div class="app-banner">
      <div id="logo" class="logo" style="padding: 8px 16px;">
        <img alt="Contacto" src="@/assets/icons/contacto.png" style="height: 40px; margin-right: 10px;" />
        <span style="color: green; font-style: italic;">all at your fingertips</span>
      </div>
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
  name: 'contactoWeb'
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#header {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #DCF8C6;
  color: white;
  flex: 1;
  flex-direction: row;
}
.app-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 48px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 1000;
    padding: 0 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
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
    padding-top: 20;
}
.logo {
    display: flex;
    align-items: center;
    font-size: 1.2em;
    font-weight: bold;
    background-color: #DCF8C6;
    color: green;
    font-size: 10px;
}
</style>