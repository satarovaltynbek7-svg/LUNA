import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/translation.json'
import ky from './locales/ky/translation.json'
import ru from './locales/ru/translation.json'

export const supportedLanguages = ['ru', 'ky', 'en']
export const languageNames = { ru: 'Русский', ky: 'Кыргызча', en: 'English' }

try {
  const savedLanguage = window.localStorage.getItem('luna-language')
  if (savedLanguage && !supportedLanguages.includes(savedLanguage)) {
    window.localStorage.removeItem('luna-language')
  }
} catch {
  // Language detection falls back to Russian when browser storage is unavailable.
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      ky: { translation: ky },
      en: { translation: en },
    },
    fallbackLng: 'ru',
    supportedLngs: supportedLanguages,
    load: 'languageOnly',
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'luna-language',
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  })

export default i18n
