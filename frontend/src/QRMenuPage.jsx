import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Check, Minus, Plus, Search, ShoppingBag, X } from 'lucide-react'
import { useCatalog, menuLabel, categoryLabel } from './context/CatalogContext.jsx'
import { createCustomerOrder } from './services/adminService.js'
import CafeImage from './components/CafeImage.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'
import ThemeSwitcher from './components/ThemeSwitcher.jsx'

const popularIds = ['latte', 'pancakes', 'avocado-toast', 'tiramisu']

function priceLabel(price, language) {
  const locale = { ru: 'ru-RU', ky: 'ky-KG', en: 'en-US' }[language] || 'ru-RU'
  return `KGS ${new Intl.NumberFormat(locale).format(price)}`
}

function QRMenuCard({ item, quantity, onAdd }) {
  const { t, i18n } = useTranslation()
  const { categoryNames } = useCatalog()

  return (
    <article className="qr-dish">
      <div className="qr-dish__image">
        <CafeImage src={item.image} alt={menuLabel(item, 'name', i18n.resolvedLanguage, t)} />
        {(item.isPopular || popularIds.includes(item.id)) && <span className="qr-dish__popular">{t('qrMenu.popular')}</span>}
      </div>
      <div className="qr-dish__body">
        <span className="qr-dish__category">{categoryLabel(item.category, categoryNames, i18n.resolvedLanguage, t)}</span>
        <div className="qr-dish__heading">
          <h3>{menuLabel(item, 'name', i18n.resolvedLanguage, t)}</h3>
          <strong>{priceLabel(item.price, i18n.resolvedLanguage)}</strong>
        </div>
        <p>{menuLabel(item, 'description', i18n.resolvedLanguage, t)}</p>
        <button type="button" className="qr-dish__add" onClick={() => onAdd(item)}>
          <Plus size={16} /> {quantity ? `${t('qrMenu.add')} · ${quantity}` : t('qrMenu.add')}
        </button>
      </div>
    </article>
  )
}

export default function QRMenuPage() {
  const { t, i18n } = useTranslation()
  const { categories, categoryNames, menuItems: catalogItems, catalogError } = useCatalog()
  const tableValue = new URLSearchParams(window.location.search).get('table')
  const tableNumber = tableValue && /^[1-9]\d{0,2}$/.test(tableValue) ? tableValue : null
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState({})
  const [cartOpen, setCartOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [orderBusy, setOrderBusy] = useState(false)
  const [orderError, setOrderError] = useState('')
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const total = catalogItems.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0)
  const query = search.trim().toLowerCase()

  const visibleItems = useMemo(() => catalogItems.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category
    const text = `${menuLabel(item, 'name', i18n.resolvedLanguage, t)} ${menuLabel(item, 'description', i18n.resolvedLanguage, t)} ${categoryLabel(item.category, categoryNames, i18n.resolvedLanguage, t)}`.toLowerCase()
    return matchesCategory && (!query || text.includes(query))
  }), [category, query, i18n.resolvedLanguage, t, catalogItems, categoryNames])
  const displayItems = category === 'all' && !query
    ? visibleItems.filter((item) => !(item.isPopular || popularIds.includes(item.id)))
    : visibleItems

  function addItem(item) {
    setConfirmed(false)
    setCart((current) => ({ ...current, [item.id]: Math.min((current[item.id] || 0) + 1, 99) }))
  }

  function changeQuantity(itemId, amount) {
    setCart((current) => {
      const quantity = (current[itemId] || 0) + amount
      if (quantity <= 0) {
        const next = { ...current }
        delete next[itemId]
        return next
      }
      return { ...current, [itemId]: Math.min(quantity, 99) }
    })
  }

  async function confirmOrder() {
    if (!count || orderBusy) return
    setOrderBusy(true)
    setOrderError('')
    try {
      await createCustomerOrder({
        items: catalogItems.filter((item) => cart[item.id]).map((item) => ({ itemId: item.slug || item.id, quantity: cart[item.id] })),
        ...(tableNumber ? { tableNumber: Number(tableNumber) } : {}),
      })
      setCart({})
      setCartOpen(false)
      setConfirmed(true)
    } catch (error) {
      setOrderError(error.code || 'api_unavailable')
    } finally {
      setOrderBusy(false)
    }
  }

  return (
    <main className="qr-menu">
      <header className="qr-menu__header">
        <Link className="qr-brand" to="/" aria-label="LUNA Café">
          <span className="qr-brand__moon" aria-hidden="true">◔</span>
          <span>LUNA<small>CAFÉ</small></span>
        </Link>
        <div className="qr-menu__header-tools"><ThemeSwitcher /><LanguageSwitcher /></div>
      </header>

      <section className="qr-menu__hero">
        <div className="qr-menu__hero-copy">
          <p className="eyebrow eyebrow--light"><span /> {t('qrMenu.eyebrow')}</p>
          <h1>{t('qrMenu.title')}</h1>
          <p>{t('qrMenu.subtitle')}</p>
          {tableNumber && <span className="qr-menu__table">{t('qrMenu.table', { number: tableNumber })}</span>}
        </div>
        <div className="qr-menu__hero-photo" role="img" aria-label="Freshly prepared café dishes" />
      </section>

      {confirmed && (
        <div className="qr-order-success" role="status">
          <span><Check size={18} /></span>
          <div><strong>{t('qrMenu.confirmedTitle')}</strong><p>{t('qrMenu.confirmedMessage')}</p></div>
          <button type="button" aria-label={t('qrMenu.dismiss')} onClick={() => setConfirmed(false)}><X size={18} /></button>
        </div>
      )}
      {orderError && <p className="qr-order-success qr-order-success--error" role="alert">{t('qrMenu.orderError')}</p>}

      <section className="qr-menu__content">
        {catalogError && <p className="reviews-data-message" role="status">{t('adminPanel.publicMenuFallback')}</p>}
        <div className="qr-menu__section-head">
          <div><p className="eyebrow"><span /> {t('qrMenu.menuEyebrow')}</p><h2>{t('qrMenu.menuTitle')}</h2></div>
          <span>{t('qrMenu.itemCount', { count: visibleItems.length })}</span>
        </div>

        <div className="qr-menu__tools">
          <label className="qr-menu__search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('qrMenu.search')} aria-label={t('qrMenu.search')} />
            {search && <button type="button" onClick={() => setSearch('')} aria-label={t('qrMenu.clear')}><X size={16} /></button>}
          </label>
          <div className="qr-menu__categories" role="group" aria-label={t('qrMenu.categoriesLabel')}>
            {['all', ...categories].map((itemCategory) => (
              <button
                type="button"
                key={itemCategory}
                className={category === itemCategory ? 'qr-menu__category qr-menu__category--active' : 'qr-menu__category'}
                aria-pressed={category === itemCategory}
                onClick={() => setCategory(itemCategory)}
              >
                {itemCategory === 'all' ? t('menu.categories.all') : categoryLabel(itemCategory, categoryNames, i18n.resolvedLanguage, t)}
              </button>
            ))}
          </div>
        </div>

        {category === 'all' && !query && (
          <div className="qr-menu__popular">
            <div className="qr-menu__section-head"><div><p className="eyebrow"><span /> {t('qrMenu.popular')}</p><h2>{t('qrMenu.popularTitle')}</h2></div></div>
            <div className="qr-menu__grid">
              {catalogItems.filter((item) => item.isPopular || popularIds.includes(item.id)).map((item) => (
                <QRMenuCard key={item.id} item={item} quantity={cart[item.id] || 0} onAdd={addItem} />
              ))}
            </div>
          </div>
        )}

        <div className="qr-menu__grid">
          {displayItems.map((item) => (
            <QRMenuCard key={item.id} item={item} quantity={cart[item.id] || 0} onAdd={addItem} />
          ))}
          {!visibleItems.length && <p className="qr-menu__empty">{t('menu.emptyText')}</p>}
        </div>
      </section>

      {count > 0 && (
        <button type="button" className="qr-cart-bar" onClick={() => setCartOpen(true)}>
          <span><ShoppingBag size={18} /> {t('qrMenu.viewOrder')} <b>{count}</b></span>
          <strong>{priceLabel(total, i18n.resolvedLanguage)}</strong>
        </button>
      )}

      {cartOpen && (
        <div className="qr-cart-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false) }}>
          <section className="qr-cart" role="dialog" aria-modal="true" aria-labelledby="qr-cart-title">
            <div className="qr-cart__header">
              <div><p className="eyebrow"><span /> {t('qrMenu.yourOrder')}</p><h2 id="qr-cart-title">{t('qrMenu.orderTitle')}</h2></div>
              <button type="button" aria-label={t('qrMenu.dismiss')} onClick={() => setCartOpen(false)}><X size={20} /></button>
            </div>
            <div className="qr-cart__items">
              {catalogItems.filter((item) => cart[item.id]).map((item) => (
                <div className="qr-cart__item" key={item.id}>
                  <div><strong>{menuLabel(item, 'name', i18n.resolvedLanguage, t)}</strong><small>{priceLabel(item.price, i18n.resolvedLanguage)}</small></div>
                  <div className="qr-cart__quantity">
                    <button type="button" aria-label={t('cart.decrease', { name: menuLabel(item, 'name', i18n.resolvedLanguage, t) })} onClick={() => changeQuantity(item.id, -1)}><Minus size={13} /></button>
                    <span>{cart[item.id]}</span>
                    <button type="button" aria-label={t('cart.increase', { name: menuLabel(item, 'name', i18n.resolvedLanguage, t) })} onClick={() => changeQuantity(item.id, 1)}><Plus size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="qr-cart__footer">
              <div><span>{t('qrMenu.total')}</span><strong>{priceLabel(total, i18n.resolvedLanguage)}</strong></div>
              <button className="qr-menu__submit" type="button" onClick={confirmOrder} disabled={orderBusy}>{orderBusy ? t('common.loading') : t('qrMenu.confirmOrder')}</button>
              {orderError && <small role="alert">{t('qrMenu.orderError')}</small>}
              <small>{t('qrMenu.orderNote')}</small>
            </div>
          </section>
        </div>
      )}
      <footer className="qr-menu__footer">LUNA CAFÉ <span>·</span> {t('qrMenu.footerNote')}</footer>
    </main>
  )
}
