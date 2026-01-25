// Date and time format configuration
export const DATE_FORMATS = {
  // Display formats
  DISPLAY_DATE: 'DD/MM/YYYY',        // For displaying dates to users
  DISPLAY_TIME: 'HH:mm',              // For displaying time to users
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm', // For displaying date and time together
  DISPLAY_DATETIME_SHORT: 'DD/MM/YY HH:mm', // Short format for compact display
  
  // Input formats (for HTML date/time inputs)
  INPUT_DATE: 'YYYY-MM-DD',           // HTML date input format
  INPUT_TIME: 'HH:mm',                // HTML time input format
  
  // ISO format for API communication
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',   // Full ISO format
  
  // Calendar formats
  CALENDAR_CELL: 'YYYY-MM-DD',        // For calendar cell comparison
};

// You can override these formats via environment variables if needed
export const getDateFormat = (key) => {
  const envKey = `VUE_APP_DATE_FORMAT_${key}`;
  return process.env[envKey] || DATE_FORMATS[key];
};

// Helper to get the current locale-based formats
// This can be extended to support multiple locales
export const getLocaleFormats = (locale = 'it') => {
  const formats = {
    it: {
      DISPLAY_DATE: 'DD/MM/YYYY',
      DISPLAY_TIME: 'HH:mm',
      DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm',
      DISPLAY_DATETIME_SHORT: 'DD/MM/YY HH:mm',
    },
    en: {
      DISPLAY_DATE: 'MM/DD/YYYY',
      DISPLAY_TIME: 'hh:mm A',
      DISPLAY_DATETIME: 'MM/DD/YYYY hh:mm A',
      DISPLAY_DATETIME_SHORT: 'MM/DD/YY hh:mm A',
    },
  };
  
  return formats[locale] || formats.it;
};
