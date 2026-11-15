import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'

// English only until Phase 7 adds Russian and the locale switch.
void i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  // React escapes rendered text already.
  interpolation: { escapeValue: false },
  returnNull: false,
})

export { i18next }
