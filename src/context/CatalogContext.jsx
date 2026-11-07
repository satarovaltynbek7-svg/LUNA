import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { MENU_CATEGORIES, MENU_ITEMS } from '../data/menuItems.js'
import { apiRequest } from '../services/apiClient.js'

const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const [menuItems, setMenuItems] = useState(MENU_ITEMS)
  const [categories, setCategories] = useState(MENU_CATEGORIES)
  const [categoryNames, setCategoryNames] = useState({})
  const [error, setError] = useState('')
  const [siteContent, setSiteContent] = useState({})
  const [banners, setBanners] = useState([])
  const [siteContentError, setSiteContentError] = useState(false)

  const refreshCatalog = useCallback(async (signal) => {
    try {
      const result = await apiRequest('/menu', { signal })
      setCategories(result.categories.map((category) => category.slug))
      setCategoryNames(Object.fromEntries(result.categories.map((category) => [category.slug, category.names])))
      setMenuItems(result.items.map((item) => ({
        ...item,
        id: item.slug,
        recordId: item.id,
        image: item.image,
      })))
      setError('')
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.code || 'api_unavailable')
      if (signal?.aborted) throw requestError
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    refreshCatalog(controller.signal).catch(() => {})
    apiRequest('/site-content', { signal: controller.signal }).then((result) => {
      setSiteContent(Object.fromEntries(result.content.map((entry) => [entry.key, entry.value])))
      setBanners(result.banners)
      setSiteContentError(false)
    }).catch((requestError) => {
      if (!controller.signal.aborted) setSiteContentError(true)
    })
    return () => controller.abort()
  }, [refreshCatalog])

  const value = useMemo(() => ({
    menuItems,
    categories,
    categoryNames,
    catalogError: error,
    siteContent,
    banners,
    siteContentError,
    refreshCatalog,
  }), [menuItems, categories, categoryNames, error, siteContent, banners, siteContentError, refreshCatalog])
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) throw new Error('useCatalog must be used within CatalogProvider')
  return context
}

export function menuLabel(item, field, language, t) {
  const values = field === 'name' ? item.names : item.descriptions
  const value = values?.[language] || values?.en
  if (value) return value
  return t(field === 'name' ? item.nameKey : item.descriptionKey)
}

export function categoryLabel(category, categoryNames, language, t) {
  return categoryNames[category]?.[language] || categoryNames[category]?.en || t(`menu.categories.${category}`)
}
