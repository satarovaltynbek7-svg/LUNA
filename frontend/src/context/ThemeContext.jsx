import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const THEME_STORAGE_KEY = 'luna-theme'

function readStoredTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'night' || saved === 'day') return saved
    return 'day'
  } catch (error) {
    return 'day'
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'night' ? '#15110e' : '#f7f3ed',
  )
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)

  const setTheme = useCallback((nextTheme) => {
    if (nextTheme !== 'day' && nextTheme !== 'night') return
    applyTheme(nextTheme)
    setThemeState(nextTheme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch (error) {
      console.warn('Could not save the theme preference.', error)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'day' ? 'night' : 'day')
  }, [setTheme, theme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
