<template>
  <div class="language-selector">
    <select v-model="currentLanguage" @change="changeLanguage" class="lang-select">
      <option value="it">🇮🇹 Italiano</option>
      <option value="en">🇬🇧 English</option>
    </select>
  </div>
</template>

<script>
import { updateAxiosLanguage } from '@/config/axiosConfig'

export default {
  name: 'LanguageSelector',
  computed: {
    currentLanguage: {
      get() {
        return this.$i18n.locale
      },
      set(value) {
        this.$i18n.locale = value
      }
    }
  },
  methods: {
    changeLanguage() {
      // Store the selected language in localStorage for persistence
      localStorage.setItem('selectedLanguage', this.currentLanguage)
      
      // Update axios headers with new language
      updateAxiosLanguage(this.currentLanguage)
      
      // Emit event to parent component if needed
      this.$emit('language-changed', this.currentLanguage)
      
      // Update document title and meta information if needed
      this.$nextTick(() => {
        this.updatePageMeta()
      })
    },
    
    updatePageMeta() {
      // Update document title with current route
      let routeTitle = 'Contacto';
      if (this.$route && this.$route.meta && this.$route.meta.titleKey) {
        routeTitle = this.$t(this.$route.meta.titleKey);
      } else if (this.$route && this.$route.meta && this.$route.meta.title) {
        routeTitle = this.$route.meta.title;
      } else if (this.$route && this.$route.name) {
        routeTitle = this.$route.name;
      }
      document.title = routeTitle + ' - Contacto';
    }
  },
  
  mounted() {
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem('selectedLanguage')
    if (savedLanguage && ['it', 'en'].includes(savedLanguage)) {
      this.$i18n.locale = savedLanguage
    }
    
    // Set initial axios headers with current language
    updateAxiosLanguage(this.$i18n.locale)
    
    // Update page meta information
    this.updatePageMeta()
  }
}
</script>

<style scoped>
.language-selector {
  display: inline-block;
  margin-left: 12px;
}

.lang-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.lang-select:hover {
  border-color: #999;
}

.lang-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}
</style>