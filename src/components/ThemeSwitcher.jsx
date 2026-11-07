import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext.jsx'

export default function ThemeSwitcher() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const isNight = theme === 'night'

  return (
    <button
      className="theme-switcher"
      type="button"
      onClick={toggleTheme}
      aria-label={t(isNight ? 'theme.switchToDay' : 'theme.switchToNight')}
      aria-pressed={isNight}
      title={t(isNight ? 'theme.night' : 'theme.day')}
    >
      <span className="theme-switcher__icon" aria-hidden="true">
        {isNight ? <Moon size={17} /> : <Sun size={17} />}
      </span>
      <span className="theme-switcher__label">{t(isNight ? 'theme.night' : 'theme.day')}</span>
    </button>
  )
}
