import { useTranslation } from 'react-i18next'
import { supportedLanguages } from '../i18n/i18n.js'

const languageCodes = { ru: 'RU', ky: 'KG', en: 'EN' }

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0]

  return (
    <div className="language-switcher" role="group" aria-label={t('language.label')}>
      {supportedLanguages.map((language, index) => (
        <span className="language-switcher__option" key={language}>
          {index > 0 && <span className="language-switcher__divider" aria-hidden="true">|</span>}
          <button
            className={currentLanguage === language ? 'language-switcher__button language-switcher__button--active' : 'language-switcher__button'}
            type="button"
            aria-label={t('language.switchTo', { language: t(`language.names.${language}`) })}
            aria-pressed={currentLanguage === language}
            onClick={() => i18n.changeLanguage(language)}
          >
            {languageCodes[language]}
          </button>
        </span>
      ))}
    </div>
  )
}
