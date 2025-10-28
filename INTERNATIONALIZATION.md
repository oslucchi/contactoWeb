# Internationalization (i18n) Implementation Guide

## Overview
The contactoWeb application has been internationalized to support multiple languages (Italian and English). The implementation uses Vue i18n plugin to manage translations.

## Structure

### Language Files
- `src/locales/it.json` - Italian translations (default language)
- `src/locales/en.json` - English translations
- `src/locales/index.js` - i18n configuration

### Key Features
1. **Language Switcher**: Available in the header for easy language switching
2. **Persistent Language Selection**: User's language preference is stored in localStorage
3. **Dynamic Page Titles**: Page titles are automatically updated when language changes
4. **Fallback Support**: Falls back to English if a translation is missing

## Usage

### Adding New Translations
1. Add the new key-value pair to both `it.json` and `en.json`
2. Use the translation in components with `{{ $t('translation.key') }}`

### Translation Categories
- `common`: Generic terms (save, cancel, edit, etc.)
- `header`: Application header elements
- `navigation`: Page titles and navigation items
- `forms`: Form fields and placeholders
- `events`: Event-related text
- `reports`: Report management text
- `projects`: Project-related text
- `companies`: Company management text
- `persons`: Contact management text
- `dashboard`: Dashboard-specific text
- `messages`: User feedback messages

### Language Switcher
The language selector is automatically included in the header and allows users to switch between Italian and English.

### Router Integration
Page titles are now managed through the router's meta.titleKey property, which references translation keys instead of hardcoded strings.

## Implementation Details

### Dependencies
- vue-i18n@8.28.2 (compatible with Vue 2.x)

### Configuration
The i18n instance is configured in `src/locales/index.js` with:
- Default locale: Italian ('it')
- Fallback locale: English ('en')
- All translation messages loaded

### Components Updated
- App.vue: Added language selector and dynamic page title support
- LanguageSelector.vue: New component for language switching
- Various form components: Updated to use translation keys
- Router: Updated to use titleKey for dynamic page titles

## Axios Language Headers

### Automatic Header Injection
All HTTP requests made through axios automatically include language headers:
- `Accept-Language`: Formatted locale (e.g., "it-IT", "en-EN")
- `Language`: Custom header with the same formatted locale

### Implementation Details
- **Interceptor Setup**: Global axios interceptor adds headers to every request
- **Dynamic Updates**: Headers update automatically when user changes language
- **Locale Mapping**: Maps Vue i18n locale codes to full locale format:
  - `it` → `it-IT`
  - `en` → `en-EN`

### Server Integration
The server can now:
- Read the `Accept-Language` or `Language` header from requests
- Return localized data based on the client's selected language
- Implement language-specific business logic

### Testing
You can verify that headers are being sent correctly by:
- Using browser DevTools Network tab to inspect HTTP request headers
- Checking server logs to see incoming `Accept-Language` and `Language` headers
- Using browser console to monitor axios interceptor behavior

## Future Enhancements
- Add more languages by creating new JSON files (e.g., fr.json, de.json)
- Implement date/number formatting based on locale
- Add RTL language support if needed
- Consider lazy loading of translation files for performance