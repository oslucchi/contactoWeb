import Vue from 'vue'
import VueI18n from 'vue-i18n'

import en from './en.json'
import it from './it.json'

Vue.use(VueI18n)

const messages = {
  en,
  it
}

const i18n = new VueI18n({
  locale: 'it', // default locale
  fallbackLocale: 'en',
  messages
})

export default i18n