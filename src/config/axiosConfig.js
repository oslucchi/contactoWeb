import axios from 'axios'

// Store reference to i18n instance
let i18nInstance = null

// Function to set i18n instance reference
export const setI18nInstance = (i18n) => {
  i18nInstance = i18n
}

// Function to get current locale and format it properly
const getFormattedLocale = () => {
  // Get current locale from stored i18n instance or fallback to 'it'
  const locale = i18nInstance ? i18nInstance.locale : 'it'
  
  // Map short locale to full locale format
  const localeMap = {
    'it': 'it-IT',
    'en': 'en-EN'
  }
  
  return localeMap[locale] || 'it-IT'
}

// Function to set up axios interceptor
export const setupAxiosInterceptor = () => {
  // Request interceptor to add language header
  axios.interceptors.request.use(
    (config) => {
      // Add Accept-Language header with current locale
      config.headers['Accept-Language'] = getFormattedLocale()
      
      // Optional: Also add a custom Language header for explicit language specification
      config.headers['Language'] = getFormattedLocale()
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
}

// Function to update axios headers when language changes
export const updateAxiosLanguage = (newLocale) => {
  const localeMap = {
    'it': 'it-IT',
    'en': 'en-EN'
  }
  
  const formattedLocale = localeMap[newLocale] || 'it-IT'
  
  // Update default headers for future requests
  axios.defaults.headers.common['Accept-Language'] = formattedLocale
  axios.defaults.headers.common['Language'] = formattedLocale
}

export default {
  setupAxiosInterceptor,
  updateAxiosLanguage,
  setI18nInstance
}