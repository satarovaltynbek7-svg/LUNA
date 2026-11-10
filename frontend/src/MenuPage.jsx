import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, ShoppingBag, X } from 'lucide-react'
import { useCatalog, menuLabel, categoryLabel } from './context/CatalogContext.jsx'
import { useCart } from './context/CartContext.jsx'
import CafeImage from './components/CafeImage.jsx'

const formatPrice = (price, t, language) => {
  const locale = { ru: 'ru-RU', ky: 'ky-KG', en: 'en-US' }[language] || 'ru-RU'
  return t('common.price', { amount: new Intl.NumberFormat(locale).format(price) })
}

function MenuCard({ item, onAdd }) {
  const { t, i18n } = useTranslation()
  const { categoryNames } = useCatalog()
  return (
    <article className="menu-card">
      <div className="menu-card__image">
        <CafeImage src={item.image} alt={menuLabel(item, 'name', i18n.resolvedLanguage, t)} />
        <span className="menu-card__category">{categoryLabel(item.category, categoryNames, i18n.resolvedLanguage, t)}</span>
      </div>
      <div className="menu-card__body">
        <div className="menu-card__heading">
          <h2>{menuLabel(item, 'name', i18n.resolvedLanguage, t)}</h2>
          <span>{formatPrice(item.price, t, i18n.resolvedLanguage)}</span>
        </div>
        <p>{menuLabel(item, 'description', i18n.resolvedLanguage, t)}</p>
        <button className="menu-card__add" type="button" onClick={() => onAdd(item)}>
          <Plus size={15} strokeWidth={1.8} /> {t('menu.addToCart')}
        </button>
      </div>
    </article>
  )
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const { cartCount, addItem, openCart, menuItems } = useCart()
  const { categories, categoryNames, catalogError } = useCatalog()
  const { t, i18n } = useTranslation()
  const categoryFilters = ['all', ...categories]

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const searchableText = `${menuLabel(item, 'name', i18n.resolvedLanguage, t)} ${menuLabel(item, 'description', i18n.resolvedLanguage, t)} ${categoryLabel(item.category, categoryNames, i18n.resolvedLanguage, t)}`.toLowerCase()
      const matchesSearch = !query || searchableText.includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, search, i18n.resolvedLanguage, t, menuItems, categoryNames])

  return (
    <main className="menu-page">
      <div className="menu-page__intro section-wrap">
        <p className="eyebrow"><span /> {t('menu.eyebrow')}</p>
        <div className="menu-page__title-row">
          <div>
            <h1>{t('menu.title')}</h1>
            <p>{t('menu.subtitle')}</p>
          </div>
          <button className="menu-page__bag" type="button" onClick={openCart} aria-label={t('menu.openCart', { count: cartCount })}>
            <ShoppingBag size={17} strokeWidth={1.7} />
            <span>{t('menu.bag')}</span>
            <span className="menu-page__bag-count">{cartCount}</span>
          </button>
        </div>
        <div className="menu-page__rule"><span>{t('menu.prepared')}</span><span>02 / 05</span></div>
      </div>

      <section className="menu-browser section-wrap" aria-label={t('menu.browserLabel')}>
        {catalogError && <p className="reviews-data-message" role="status">{t('adminPanel.publicMenuFallback')}</p>}
        <div className="menu-tools">
          <div className="menu-filters" role="group" aria-label={t('menu.filtersLabel')}>
            {categoryFilters.map((category) => {
              const count = category === 'all'
                ? menuItems.length
                : menuItems.filter((item) => item.category === category).length
              return (
                <button
                  className={`menu-filter${activeCategory === category ? ' menu-filter--active' : ''}`}
                  type="button"
                  key={category}
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category === 'all' ? t('menu.categories.all') : categoryLabel(category, categoryNames, i18n.resolvedLanguage, t)}<span>{String(count).padStart(2, '0')}</span>
                </button>
              )
            })}
          </div>
          <label className="menu-search">
            <Search size={17} strokeWidth={1.7} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('menu.searchPlaceholder')}
              aria-label={t('menu.searchLabel')}
            />
            {search && <button type="button" aria-label={t('menu.clearSearch')} onClick={() => setSearch('')}><X size={15} /></button>}
          </label>
        </div>

        <div className="menu-results" aria-live="polite">
          <span>{activeCategory === 'all' ? t('menu.all') : categoryLabel(activeCategory, categoryNames, i18n.resolvedLanguage, t)}</span>
          <span>{t('menu.items', { count: visibleItems.length })}</span>
        </div>

        {visibleItems.length ? (
          <div className="menu-grid">
            {visibleItems.map((item) => <MenuCard key={item.id} item={item} onAdd={addItem} />)}
          </div>
        ) : (
          <div className="menu-empty">
            <p>{t('menu.emptyTitle')}</p>
            <span>{t('menu.emptyText')}</span>
            <button type="button" onClick={() => { setSearch(''); setActiveCategory('all') }}>{t('menu.showAll')}</button>
          </div>
        )}
      </section>
    </main>
  )
}