<template>
  <div>
    <button>
      <img src="@/assets/icons/search.png" :alt="$t('common.search')" class="icon" />
    </button>
    <!-- <img src="@/assets/icons/search.png" alt="Search" class="icon" /> -->
    <div class="search-by-string" role="search">
      <!-- <span class="icon" aria-hidden="true" v-html="lensSvg"></span> -->
      <input
        type="text"
        :placeholder="placeholder"
        :value="value"
        @input="onInputEvent"
        @keyup="$emit('keyup', $event)"
        class="search-input"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SearchByString',
  props: {
    placeholder: { type: String, default: '' },
    // parent method to receive current input string on each key typed (optional)
    onInput: { type: Function, default: null },
    value: { type: String, default: '' } // support v-model / controlled usage
  },
  data() {
    return {
      // simple inline svg for search lens
      // lensSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
  },
  methods: {
    onInputEvent(e) {
      const v = e && e.target ? e.target.value : '';
      this.$emit('input', v); // emit for v-model compatibility
      // call parent method if provided
      if (typeof this.onInput === 'function') {
        try { this.onInput(v); } catch (err) { /* ignore parent errors */ }
      }
    }
  }
};
</script>

<style scoped>
.search-by-string {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #ccc;
  padding: 4px 6px;
  border-radius: 4px;
  background: #fff;
  height: 30px;
  box-sizing: border-box;
}
.search-by-string .icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #666;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}

.icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}

.search-input {
  border: none;
  outline: none;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0;
  min-width: 80px;
  background: transparent;
  color: inherit;
}
</style>