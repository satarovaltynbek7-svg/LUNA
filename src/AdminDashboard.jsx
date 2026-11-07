import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight, BarChart3, Check, ChevronLeft, ClipboardList, Image, LayoutDashboard,
  LogOut, Menu as MenuIcon, MessageCircle, Pencil, Printer, QrCode,
  Settings, Trash2, Users, UtensilsCrossed, X,
} from 'lucide-react'
import { useAuth } from './context/AuthContext.jsx'
import { useCatalog } from './context/CatalogContext.jsx'
import { ReviewsManagement } from './ReviewsPage.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'
import ThemeSwitcher from './components/ThemeSwitcher.jsx'
import BrandedQRCode from './components/BrandedQRCode.jsx'
import {
  deleteBanner, deleteGalleryImage, deleteMenuCategory, deleteMenuItem, deleteReservation,
  fetchAdminCustomers, fetchAdminDashboard, fetchAdminGallery, fetchAdminMenu,
  fetchAdminOrders, fetchAdminReservations, fetchAdminContent, saveBanner, saveGalleryImage,
  saveMenuCategory, saveMenuItem, saveSiteContent, updateOrderStatus, updateReservationStatus,
} from './services/adminService.js'

const OWNER_EMAIL = 'asema008@gmail.com'
const localeCodes = { ru: 'ru-RU', ky: 'ky-KG', en: 'en-US' }
const sections = [
  ['overview', LayoutDashboard],
  ['menu', UtensilsCrossed],
  ['orders', ClipboardList],
  ['reservations', BarChart3],
  ['reviews', MessageCircle],
  ['customers', Users],
  ['gallery', Image],
  ['content', Settings],
  ['qr', QrCode],
]
const orderStatuses = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']
const reservationStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED']
const emptyLocalized = () => ({ ru: '', ky: '', en: '' })
const emptyMenuItem = () => ({
  slug: '', categoryId: '', names: emptyLocalized(), descriptions: emptyLocalized(),
  price: '', imageUrl: '', isPopular: false, active: true, sortOrder: 0,
})
const emptyCategory = () => ({ slug: '', names: emptyLocalized(), sortOrder: 0, active: true })
const emptyGallery = () => ({ imageUrl: '', category: 'space', captions: emptyLocalized(), altTexts: emptyLocalized(), active: true, sortOrder: 0 })
const emptyBanner = () => ({ titles: emptyLocalized(), messages: emptyLocalized(), imageUrl: '', linkUrl: '', active: false, sortOrder: 0 })

function localizedValue(values, language) {
  return values?.[language] || values?.en || ''
}

function AdminField({ label, value, onChange, type = 'text', required = false, ...props }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} {...props} />
    </label>
  )
}

function LocalizedFields({ label, values, onChange, as = 'input', maxLength }) {
  const { t } = useTranslation()
  return (
    <fieldset className="admin-localized">
      <legend>{label}</legend>
      {['ru', 'ky', 'en'].map((language) => (
        <label className="admin-field" key={language}>
          <span>{t(`language.names.${language}`)}</span>
          {as === 'textarea'
            ? <textarea value={values?.[language] || ''} maxLength={maxLength} required onChange={(event) => onChange(language, event.target.value)} rows={3} />
            : <input value={values?.[language] || ''} maxLength={maxLength} required onChange={(event) => onChange(language, event.target.value)} />}
        </label>
      ))}
    </fieldset>
  )
}

function ForbiddenAdmin() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  return (
    <main className="admin-login">
      <section className="admin-login__card" role="alert">
        <div className="admin-login__tools"><ThemeSwitcher /><LanguageSwitcher /></div>
        <p className="eyebrow"><span /> {t('adminPanel.ownerAccess')}</p>
        <h1>{t('adminPanel.accessDenied')}</h1>
        <p>{t('adminPanel.ownerOnly')}</p>
        <div className="admin-form-actions">
          <button className="button button--dark" type="button" onClick={() => logout()}>{t('auth.logout')}</button>
          <Link className="text-link" to="/">{t('qrMenu.backToSite')}</Link>
        </div>
      </section>
    </main>
  )
}

function OverviewSection({ data, onOpen }) {
  const { t, i18n } = useTranslation()
  const statistics = data?.statistics || {}
  const cards = [
    ['customers', statistics.customers, Users],
    ['menuItems', statistics.menuItems, UtensilsCrossed],
    ['openOrders', statistics.openOrders, ClipboardList],
    ['pendingReservations', statistics.pendingReservations, BarChart3],
    ['pendingReviews', statistics.pendingReviews, MessageCircle],
  ]
  return (
    <section className="admin-section">
      <div className="admin-section__heading"><p className="eyebrow"><span /> {t('adminPanel.overview')}</p><h1>{t('adminPanel.welcome')}</h1></div>
      <div className="admin-stat-grid">
        {cards.map(([key, value, Icon]) => (
          <button className="admin-stat-card" type="button" key={key} onClick={() => onOpen(key)}>
            <span><Icon size={18} /></span><strong>{value ?? 0}</strong><small>{t(`adminPanel.${key}`)}</small>
          </button>
        ))}
      </div>
      <div className="admin-panel-card">
        <div className="admin-card-heading"><div><p className="eyebrow"><span /> {t('adminPanel.sections.orders')}</p><h2>{t('adminPanel.recentOrders')}</h2></div></div>
        {(data?.recentOrders || []).length ? data.recentOrders.map((order) => (
          <article className="admin-data-row" key={order.id}>
            <div><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><small>{new Intl.DateTimeFormat(localeCodes[i18n.resolvedLanguage] || 'ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.createdAt))}</small></div>
            <span>{t(`adminPanel.orderStatus.${order.status}`)}</span><b>{t('common.price', { amount: order.total.toLocaleString() })}</b>
          </article>
        )) : <p className="admin-empty">{t('adminPanel.noOrders')}</p>}
      </div>
    </section>
  )
}

function AdminPagination({ pagination, onPageChange }) {
  const { t } = useTranslation()
  if (!pagination || pagination.pages <= 1) return null
  return (
    <nav className="admin-pagination" aria-label={t('adminPanel.pagination')}>
      <button type="button" className="button button--outline" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>{t('adminPanel.previousPage')}</button>
      <span>{t('adminPanel.pagePosition', { page: pagination.page, pages: pagination.pages })}</span>
      <button type="button" className="button button--outline" disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)}>{t('adminPanel.nextPage')}</button>
    </nav>
  )
}

function MenuSection({ categories, onRefresh, notify }) {
  const { t, i18n } = useTranslation()
  const [itemDraft, setItemDraft] = useState(emptyMenuItem)
  const [categoryDraft, setCategoryDraft] = useState(emptyCategory)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submitItem(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const payload = { ...itemDraft, price: Number(itemDraft.price), sortOrder: Number(itemDraft.sortOrder) }
      await saveMenuItem(payload, editingItem)
      setItemDraft(emptyMenuItem())
      setEditingItem(null)
      await onRefresh()
      notify(t('adminPanel.saved'))
    } catch (error) {
      notify('', error.code || 'request_failed')
    } finally {
      setBusy(false)
    }
  }

  async function submitCategory(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await saveMenuCategory({ ...categoryDraft, sortOrder: Number(categoryDraft.sortOrder) }, editingCategory)
      setCategoryDraft(emptyCategory())
      setEditingCategory(null)
      await onRefresh()
      notify(t('adminPanel.saved'))
    } catch (error) {
      notify('', error.code || 'request_failed')
    } finally {
      setBusy(false)
    }
  }

  function editItem(item) {
    setItemDraft({
      slug: item.slug, categoryId: item.categoryId, names: item.names, descriptions: item.descriptions,
      price: item.price, imageUrl: item.imageUrl, isPopular: item.isPopular, active: item.active, sortOrder: item.sortOrder,
    })
    setEditingItem(item.id)
  }

  async function removeItem(item) {
    if (!window.confirm(t('adminPanel.confirmDelete'))) return
    try {
      await deleteMenuItem(item.id)
      await onRefresh()
      notify(t('adminPanel.deleted'))
    } catch (error) {
      notify('', error.code || 'request_failed')
    }
  }

  async function removeCategory(category) {
    if (!window.confirm(t('adminPanel.confirmDelete'))) return
    try {
      await deleteMenuCategory(category.id)
      await onRefresh()
      notify(t('adminPanel.deleted'))
    } catch (error) {
      notify('', error.code || 'request_failed')
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-section__heading"><p className="eyebrow"><span /> {t('adminPanel.sections.menu')}</p><h1>{t('adminPanel.menuManagement')}</h1></div>
      <div className="admin-admin-grid">
        <form className="admin-panel-card admin-form" onSubmit={submitItem}>
          <div className="admin-card-heading"><h2>{t(editingItem ? 'adminPanel.editItem' : 'adminPanel.addItem')}</h2>{editingItem && <button className="admin-icon-button" type="button" aria-label={t('common.dismiss')} onClick={() => { setEditingItem(null); setItemDraft(emptyMenuItem()) }}><X size={17} /></button>}</div>
          <div className="admin-form-grid">
            <AdminField label={t('adminPanel.slug')} value={itemDraft.slug} onChange={(slug) => setItemDraft((value) => ({ ...value, slug }))} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required />
            <label className="admin-field"><span>{t('adminPanel.category')}</span><select required value={itemDraft.categoryId} onChange={(event) => setItemDraft((value) => ({ ...value, categoryId: event.target.value }))}><option value="">{t('adminPanel.selectCategory')}</option>{categories.map((category) => <option value={category.id} key={category.id}>{localizedValue(category.names, i18n.resolvedLanguage)}</option>)}</select></label>
            <AdminField label={t('adminPanel.price')} type="number" value={itemDraft.price} onChange={(price) => setItemDraft((value) => ({ ...value, price }))} min="1" max="1000000" required />
            <AdminField label={t('adminPanel.imageUrl')} value={itemDraft.imageUrl} onChange={(imageUrl) => setItemDraft((value) => ({ ...value, imageUrl }))} type="url" required />
            <LocalizedFields label={t('adminPanel.itemName')} values={itemDraft.names} onChange={(language, value) => setItemDraft((draft) => ({ ...draft, names: { ...draft.names, [language]: value } }))} />
            <LocalizedFields label={t('adminPanel.itemDescription')} values={itemDraft.descriptions} onChange={(language, value) => setItemDraft((draft) => ({ ...draft, descriptions: { ...draft.descriptions, [language]: value } }))} as="textarea" maxLength={500} />
            <label className="admin-check"><input type="checkbox" checked={itemDraft.isPopular} onChange={(event) => setItemDraft((value) => ({ ...value, isPopular: event.target.checked }))} />{t('adminPanel.popular')}</label>
            <label className="admin-check"><input type="checkbox" checked={itemDraft.active} onChange={(event) => setItemDraft((value) => ({ ...value, active: event.target.checked }))} />{t('adminPanel.active')}</label>
          </div>
          <button className="button button--dark" type="submit" disabled={busy}>{t(editingItem ? 'adminPanel.saveChanges' : 'adminPanel.addItem')} <Check size={15} /></button>
        </form>
        <div className="admin-panel-card">
          <div className="admin-card-heading"><h2>{t('adminPanel.categories')}</h2></div>
          <form className="admin-form" onSubmit={submitCategory}>
            <AdminField label={t('adminPanel.slug')} value={categoryDraft.slug} onChange={(slug) => setCategoryDraft((value) => ({ ...value, slug }))} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={60} required />
            <LocalizedFields label={t('adminPanel.categoryName')} values={categoryDraft.names} onChange={(language, value) => setCategoryDraft((draft) => ({ ...draft, names: { ...draft.names, [language]: value } }))} />
            <button type="submit" className="button button--dark" disabled={busy}>{t(editingCategory ? 'adminPanel.saveChanges' : 'adminPanel.addCategory')}</button>
          </form>
          <div className="admin-category-list">
            {categories.map((category) => (
              <div className="admin-data-row" key={category.id}>
                <span>{localizedValue(category.names, i18n.resolvedLanguage)} <small>({category.items.length})</small></span>
                <button className="admin-icon-button" type="button" aria-label={t('adminPanel.edit')} onClick={() => { setEditingCategory(category.id); setCategoryDraft({ slug: category.slug, names: category.names, sortOrder: category.sortOrder, active: category.active }) }}><Pencil size={15} /></button>
                <button className="admin-icon-button" type="button" aria-label={t('adminPanel.delete')} onClick={() => removeCategory(category)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="admin-panel-card">
        <div className="admin-card-heading"><h2>{t('adminPanel.menuItems')}</h2><span>{categories.reduce((sum, category) => sum + category.items.length, 0)}</span></div>
        <div className="admin-menu-table">
          {categories.flatMap((category) => category.items.map((item) => (
            <article className="admin-menu-row" key={item.id}>
              <img src={item.imageUrl} alt="" loading="lazy" />
              <div><strong>{localizedValue(item.names, i18n.resolvedLanguage)}</strong><small>{localizedValue(category.names, i18n.resolvedLanguage)} · {item.active ? t('adminPanel.active') : t('adminPanel.hidden')}</small></div>
              <b>{t('common.price', { amount: item.price.toLocaleString() })}</b>
              <button className="admin-icon-button" type="button" aria-label={t('adminPanel.edit')} onClick={() => editItem(item)}><Pencil size={15} /></button>
              <button className="admin-icon-button" type="button" aria-label={t('adminPanel.delete')} onClick={() => removeItem(item)}><Trash2 size={15} /></button>
            </article>
          )))}
        </div>
      </div>
    </section>
  )
}

function OrdersSection({ data, pagination, onPageChange, refresh, notify }) {
  const { t, i18n } = useTranslation()
  return (
    <section className="admin-section">
      <div className="admin-section__heading"><p className="eyebrow"><span /> {t('adminPanel.sections.orders')}</p><h1>{t('adminPanel.orderManagement')}</h1></div>
      {data.map((order) => (
        <article className="admin-panel-card admin-record-card" key={order.id}>
          <div className="admin-record-card__heading"><div><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><small>{new Intl.DateTimeFormat(localeCodes[i18n.resolvedLanguage] || 'ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.createdAt))}</small></div>
            <label className="admin-field"><span>{t('adminPanel.status')}</span><select value={order.status} onChange={async (event) => { try { await updateOrderStatus(order.id, event.target.value); await refresh(); notify(t('adminPanel.saved')) } catch (error) { notify('', error.code || 'request_failed') } }}>{orderStatuses.map((status) => <option key={status} value={status}>{t(`adminPanel.orderStatus.${status}`)}</option>)}</select></label>
          </div>
          {order.tableNumber && <p>{t('qrMenu.table', { number: order.tableNumber })}</p>}
          <ul>{order.lines.map((line) => <li key={line.id}>{line.quantity} × {localizedValue(line.itemNames, i18n.resolvedLanguage)} · {t('common.price', { amount: line.lineTotal.toLocaleString() })}</li>)}</ul>
          {order.note && <p>{order.note}</p>}
          <strong>{t('adminPanel.total')}: {t('common.price', { amount: order.total.toLocaleString() })}</strong>
        </article>
      ))}
      {!data.length && <p className="admin-empty">{t('adminPanel.noOrders')}</p>}
      <AdminPagination pagination={pagination} onPageChange={onPageChange} />
    </section>
  )
}

function ReservationsSection({ data, pagination, onPageChange, refresh, notify }) {
  const { t, i18n } = useTranslation()
  return (
    <section className="admin-section">
      <div className="admin-section__heading"><p className="eyebrow"><span /> {t('adminPanel.sections.reservations')}</p><h1>{t('adminPanel.reservationManagement')}</h1></div>
      {data.map((reservation) => (
        <article className="admin-panel-card admin-record-card" key={reservation.id}>
          <div className="admin-record-card__heading"><div><strong>{reservation.customerName}</strong><small>{reservation.phone}</small><small>{new Intl.DateTimeFormat(localeCodes[i18n.resolvedLanguage] || 'ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(reservation.dateTime))} · {t('adminPanel.guests', { count: reservation.guestCount })}</small></div>
            <label className="admin-field"><span>{t('adminPanel.status')}</span><select value={reservation.status} onChange={async (event) => { try { await updateReservationStatus(reservation.id, event.target.value); await refresh(); notify(t('adminPanel.saved')) } catch (error) { notify('', error.code || 'request_failed') } }}>{reservationStatuses.map((status) => <option key={status} value={status}>{t(`adminPanel.reservationStatus.${status}`)}</option>)}</select></label>
          </div>
          {reservation.specialRequests && <p>{reservation.specialRequests}</p>}
          <button className="admin-icon-button admin-danger" type="button" aria-label={t('adminPanel.delete')} onClick={async () => { if (!window.confirm(t('adminPanel.confirmDelete'))) return; try { await deleteReservation(reservation.id); await refresh(); notify(t('adminPanel.deleted')) } catch (error) { notify('', error.code || 'request_failed') } }}><Trash2 size={15} /></button>
        </article>
      ))}
      {!data.length && <p className="admin-empty">{t('adminPanel.noReservations')}</p>}
      <AdminPagination pagination={pagination} onPageChange={onPageChange} />
    </section>
  )
}

function CustomersSection({ data, pagination, onPageChange }) {
  const { t, i18n } = useTranslation()
  return (
    <section className="admin-section">
      <div className="admin-section__heading"><p className="eyebrow"><span /> {t('adminPanel.sections.customers')}</p><h1>{t('adminPanel.customerList')}</h1></div>
      <div className="admin-panel-card">
        {data.map((customer) => (
          <article className="admin-data-row" key={customer.id}>
            <div className="admin-customer"><span>{customer.fullName.slice(0, 1).toUpperCase()}</span><strong>{customer.fullName}</strong></div>
            <a href={`mailto:${customer.email}`}>{customer.email}</a>
            <small>{t('adminPanel.customerActivity', { reviews: customer._count.reviews, orders: customer._count.orders })}</small>
            <time>{new Intl.DateTimeFormat(localeCodes[i18n.resolvedLanguage] || 'ru-RU', { dateStyle: 'medium' }).format(new Date(customer.createdAt))}</time>
          </article>
        ))}
        {!data.length && <p className="admin-empty">{t('adminPanel.noCustomers')}</p>}
      </div>
      <AdminPagination pagination={pagination} onPageChange={onPageChange} />
    </section>
  )
}

function GallerySection({ images, refresh, notify }) {
  const { t, i18n } = useTranslation()
  const [draft, setDraft] = useState(emptyGallery)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await saveGalleryImage({ ...draft, sortOrder: Number(draft.sortOrder) }, editing)
      setDraft(emptyGallery())
      setEditing(null)
      await refresh()
      notify(t('adminPanel.saved'))
    } catch (error) {
      notify('', error.code || 'request_failed')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="admin-section">
      <div className="admin-section__heading"><p className="eyebrow"><span /> {t('adminPanel.sections.gallery')}</p><h1>{t('adminPanel.galleryManagement')}</h1></div>
      <form className="admin-panel-card admin-form" onSubmit={submit}>
        <div className="admin-card-heading"><h2>{t(editing ? 'adminPanel.editImage' : 'adminPanel.addImage')}</h2></div>
        <div className="admin-form-grid">
          <AdminField label={t('adminPanel.imageUrl')} value={draft.imageUrl} onChange={(imageUrl) => setDraft((value) => ({ ...value, imageUrl }))} type="url" required />
          <label className="admin-field"><span>{t('adminPanel.category')}</span><select value={draft.category} onChange={(event) => setDraft((value) => ({ ...value, category: event.target.value }))}>{['space', 'drinks', 'kitchen'].map((category) => <option key={category} value={category}>{t(`gallery.categories.${category}`)}</option>)}</select></label>
          <LocalizedFields label={t('adminPanel.caption')} values={draft.captions} onChange={(language, value) => setDraft((current) => ({ ...current, captions: { ...current.captions, [language]: value } }))} />
          <LocalizedFields label={t('adminPanel.altText')} values={draft.altTexts} onChange={(language, value) => setDraft((current) => ({ ...current, altTexts: { ...current.altTexts, [language]: value } }))} />
        </div>
        <button className="button button--dark" disabled={busy}>{t(editing ? 'adminPanel.saveChanges' : 'adminPanel.addImage')}</button>
      </form>
      <div className="admin-gallery-grid">
        {images.map((image) => (
          <article className="admin-gallery-card" key={image.id}>
            <img src={image.imageUrl} alt={localizedValue(image.altTexts, i18n.resolvedLanguage)} loading="lazy" />
            <strong>{localizedValue(image.captions, i18n.resolvedLanguage)}</strong>
            <div><button className="admin-icon-button" type="button" aria-label={t('adminPanel.edit')} onClick={() => { setDraft({ imageUrl: image.imageUrl, category: image.category, captions: image.captions, altTexts: image.altTexts, active: image.active, sortOrder: image.sortOrder }); setEditing(image.id) }}><Pencil size={15} /></button><button className="admin-icon-button" type="button" aria-label={t('adminPanel.delete')} onClick={async () => { if (!window.confirm(t('adminPanel.confirmDelete'))) return; try { await deleteGalleryImage(image.id); await refresh(); notify(t('adminPanel.deleted')) } catch (error) { notify('', error.code || 'request_failed') } }}><Trash2 size={15} /></button></div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ContentSection({ data, refresh, notify }) {
  const { t, i18n } = useTranslation()
  const [key, setKey] = useState('')
  const [value, setValue] = useState(emptyLocalized)
  const [banner, setBanner] = useState(emptyBanner)
  const [editingBanner, setEditingBanner] = useState(null)
  const [busy, setBusy] = useState(false)
  async function saveContent(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await saveSiteContent(key, value)
      setKey('')
      setValue(emptyLocalized())
      await refresh()
      notify(t('adminPanel.saved'))
    } catch (error) {
      notify('', error.code || 'request_failed')
    } finally {
      setBusy(false)
    }
  }
  async function savePromo(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await saveBanner({ ...banner, sortOrder: Number(banner.sortOrder) }, editingBanner)
      setBanner(emptyBanner())
      setEditingBanner(null)
      await refresh()
      notify(t('adminPanel.saved'))
    } catch (error) {
      notify('', error.code || 'request_failed')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="admin-section">
      <div className="admin-section__heading"><p className="eyebrow"><span /> {t('adminPanel.sections.content')}</p><h1>{t('adminPanel.contentManagement')}</h1></div>
      <div className="admin-admin-grid">
        <form className="admin-panel-card admin-form" onSubmit={saveContent}>
          <h2>{t('adminPanel.websiteContent')}</h2>
          <AdminField label={t('adminPanel.contentKey')} value={key} onChange={setKey} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required />
          <LocalizedFields label={t('adminPanel.contentValue')} values={value} onChange={(language, text) => setValue((current) => ({ ...current, [language]: text }))} as="textarea" maxLength={500} />
          <button className="button button--dark" disabled={busy}>{t('adminPanel.saveChanges')}</button>
          <div className="admin-category-list">{data.content.map((item) => <button className="admin-content-row" type="button" key={item.id} onClick={() => { setKey(item.key); setValue(item.value) }}><strong>{item.key}</strong><span>{localizedValue(item.value, i18n.resolvedLanguage)}</span><Pencil size={14} /></button>)}</div>
        </form>
        <form className="admin-panel-card admin-form" onSubmit={savePromo}>
          <h2>{t('adminPanel.promotionalBanners')}</h2>
          <LocalizedFields label={t('adminPanel.bannerTitle')} values={banner.titles} onChange={(language, text) => setBanner((current) => ({ ...current, titles: { ...current.titles, [language]: text } }))} />
          <LocalizedFields label={t('adminPanel.bannerMessage')} values={banner.messages} onChange={(language, text) => setBanner((current) => ({ ...current, messages: { ...current.messages, [language]: text } }))} as="textarea" maxLength={300} />
          <AdminField label={t('adminPanel.imageUrl')} value={banner.imageUrl} onChange={(imageUrl) => setBanner((current) => ({ ...current, imageUrl }))} type="url" />
          <AdminField label={t('adminPanel.linkUrl')} value={banner.linkUrl} onChange={(linkUrl) => setBanner((current) => ({ ...current, linkUrl }))} type="url" />
          <label className="admin-check"><input type="checkbox" checked={banner.active} onChange={(event) => setBanner((current) => ({ ...current, active: event.target.checked }))} />{t('adminPanel.active')}</label>
          <button className="button button--dark" disabled={busy}>{t(editingBanner ? 'adminPanel.saveChanges' : 'adminPanel.addBanner')}</button>
          <div className="admin-category-list">{data.banners.map((item) => (
            <div className="admin-data-row" key={item.id}><span>{localizedValue(item.titles, i18n.resolvedLanguage)} · {item.active ? t('adminPanel.active') : t('adminPanel.hidden')}</span>
              <button className="admin-icon-button" type="button" aria-label={t('adminPanel.edit')} onClick={() => { setBanner({ titles: item.titles, messages: item.messages, imageUrl: item.imageUrl || '', linkUrl: item.linkUrl || '', active: item.active, startsAt: item.startsAt, endsAt: item.endsAt, sortOrder: item.sortOrder }); setEditingBanner(item.id) }}><Pencil size={15} /></button>
              <button className="admin-icon-button" type="button" aria-label={t('adminPanel.delete')} onClick={async () => { if (!window.confirm(t('adminPanel.confirmDelete'))) return; try { await deleteBanner(item.id); await refresh(); notify(t('adminPanel.deleted')) } catch (error) { notify('', error.code || 'request_failed') } }}><Trash2 size={15} /></button>
            </div>
          ))}</div>
        </form>
      </div>
    </section>
  )
}

function QRSection() {
  const { t } = useTranslation()
  const [tableNumber, setTableNumber] = useState('')
  const menuUrl = new URL('/qr-menu', window.location.origin)
  if (tableNumber) menuUrl.searchParams.set('table', tableNumber)
  return (
    <section className="admin-section">
      <div className="admin-section__heading"><p className="eyebrow"><span /> {t('qrMenu.adminEyebrow')}</p><h1>{t('qrMenu.adminTitle')}</h1></div>
      <section className="qr-admin__panel">
        <div className="qr-admin__settings">
          <h2>{t('qrMenu.qrTitle')}</h2><p>{t('qrMenu.qrHelp')}</p>
          <label className="admin-field"><span>{t('qrMenu.tableLabel')}</span><input type="number" min="1" max="999" value={tableNumber} onChange={(event) => { const next = event.target.value; if (next === '' || /^[1-9]\d{0,2}$/.test(next)) setTableNumber(next) }} placeholder={t('qrMenu.allTables')} /></label>
          <p className="qr-admin__url-label">{t('qrMenu.menuLink')}</p><a className="qr-admin__url" href={menuUrl.href} target="_blank" rel="noreferrer">{menuUrl.href}</a>
          <button type="button" className="button button--dark" onClick={() => window.print()}><Printer size={16} /> {t('qrMenu.print')}</button>
        </div>
        <div className="qr-admin__preview"><BrandedQRCode value={menuUrl.href} /><p>{t('qrMenu.livePreview')}</p></div>
      </section>
    </section>
  )
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, loading: authLoading, isAdmin, login, logout, refreshUser } = useAuth()
  const { refreshCatalog } = useCatalog()
  const [section, setSection] = useState('overview')
  const [sectionPages, setSectionPages] = useState({ orders: 1, reservations: 1, customers: 1 })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [checking, setChecking] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const previousTitle = document.title
    let robots = document.querySelector('meta[name="robots"]')
    const createdRobots = !robots
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    const previousRobots = robots.content
    robots.content = 'noindex, nofollow'
    document.title = `${t('adminPanel.title')} · LUNA CAFÉ`
    return () => {
      document.title = previousTitle
      if (createdRobots) robots.remove()
      else robots.content = previousRobots
    }
  }, [t])

  const loaders = useMemo(() => ({
    overview: () => fetchAdminDashboard(),
    menu: () => fetchAdminMenu(),
    orders: (page) => fetchAdminOrders(page),
    reservations: (page) => fetchAdminReservations(page),
    customers: (page) => fetchAdminCustomers(page),
    gallery: () => fetchAdminGallery(),
    content: () => fetchAdminContent(),
  }), [])

  const refreshSection = useCallback(async (target = section) => {
    const load = loaders[target]
    if (!load) return
    setLoading(true)
    setError('')
    try {
      const result = await load(sectionPages[target] || 1)
      setData((current) => ({ ...current, [target]: result }))
    } catch (requestError) {
      setError(requestError.code || 'request_failed')
    } finally {
      setLoading(false)
    }
  }, [loaders, section, sectionPages])

  useEffect(() => {
    if (isAdmin && section !== 'reviews' && section !== 'qr') refreshSection(section)
  }, [isAdmin, section, refreshSection])

  async function ownerLogin(event) {
    event.preventDefault()
    setChecking(true)
    setLoginError('')
    try {
      const authenticated = await login({ email: OWNER_EMAIL, password })
      if (authenticated.email !== OWNER_EMAIL || authenticated.role !== 'ADMIN') {
        await logout()
        throw new Error('admin_required')
      }
      setPassword('')
      await refreshUser()
    } catch (requestError) {
      setLoginError(requestError.code === 'api_unavailable' ? t('auth.apiUnavailable') : t('adminPanel.loginError'))
    } finally {
      setChecking(false)
    }
  }

  function notify(message, errorCode = '') {
    setNotice(message)
    setError(errorCode)
    window.setTimeout(() => setNotice(''), 3500)
  }

  if (authLoading) return <main className="admin-login"><p role="status">{t('common.loading')}</p></main>
  if (!user) {
    return (
      <main className="admin-login">
        <Link className="qr-brand" to="/" aria-label="LUNA Café"><span className="qr-brand__moon">◔</span><span>LUNA<small>CAFÉ</small></span></Link>
        <section className="admin-login__card">
          <div className="admin-login__tools"><ThemeSwitcher /><LanguageSwitcher /></div>
          <p className="eyebrow"><span /> {t('adminPanel.ownerAccess')}</p><h1>{t('adminPanel.loginTitle')}</h1><p>{t('adminPanel.ownerOnly')}</p>
          <form className="auth-form" onSubmit={ownerLogin}>
            <AdminField label={t('auth.email')} value={OWNER_EMAIL} onChange={() => {}} readOnly />
            <AdminField label={t('auth.password')} value={password} onChange={setPassword} type="password" autoComplete="current-password" required />
            {loginError && <p className="auth-form__error" role="alert">{loginError}</p>}
            <button type="submit" className="button button--dark auth-form__submit" disabled={checking}>{checking ? t('common.loading') : t('auth.login')}</button>
          </form>
          <Link className="admin-login__back" to="/">{t('qrMenu.backToSite')} <ArrowUpRight size={14} /></Link>
        </section>
      </main>
    )
  }
  if (!isAdmin) return <ForbiddenAdmin />

  async function refreshMenu() {
    await refreshSection('menu')
    await refreshCatalog()
  }
  return (
    <main className="admin-shell">
      <button className="admin-mobile-toggle" type="button" aria-label={t('adminPanel.openNavigation')} onClick={() => setMobileNavOpen((open) => !open)}><MenuIcon size={20} /></button>
      <aside className={`admin-sidebar${mobileNavOpen ? ' admin-sidebar--open' : ''}`}>
        <Link className="admin-brand" to="/"><span>◔</span><strong>LUNA<small>CAFÉ</small></strong></Link>
        <p className="admin-sidebar__label">{t('adminPanel.workspace')}</p>
        <nav aria-label={t('adminPanel.navigation')}>
          {sections.map(([key, Icon]) => (
            <button type="button" key={key} className={section === key ? 'is-active' : ''} onClick={() => { setSection(key); setMobileNavOpen(false); setError('') }}>
              <Icon size={17} /><span>{t(`adminPanel.sections.${key}`)}</span>
              {key === 'orders' && data.overview?.statistics?.openOrders > 0 && <i>{data.overview.statistics.openOrders}</i>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__bottom"><span>{user.fullName}</span><small>{user.email}</small><button type="button" onClick={async () => { try { await logout() } catch { setError('sign_out_error') } }}><LogOut size={15} />{t('auth.logout')}</button></div>
      </aside>
      {mobileNavOpen && <button className="admin-sidebar-backdrop" type="button" aria-label={t('common.dismiss')} onClick={() => setMobileNavOpen(false)} />}
      <div className="admin-main">
        <header className="admin-topbar"><div><button type="button" className="admin-back-link" onClick={() => navigate('/')}><ChevronLeft size={15} /> {t('qrMenu.backToSite')}</button><span> / </span><strong>{t(`adminPanel.sections.${section}`)}</strong></div><div><ThemeSwitcher /><LanguageSwitcher /><span className="admin-owner-chip">{user.fullName}</span></div></header>
        {notice && <p className="admin-alert admin-alert--success" role="status"><Check size={16} />{notice}</p>}
        {error && <p className="admin-alert admin-alert--error" role="alert">{t('adminPanel.requestFailed', { code: error })}</p>}
        {loading && <p className="admin-loading" role="status">{t('common.loading')}</p>}
        {section === 'overview' && <OverviewSection data={data.overview} onOpen={(key) => setSection(key === 'customers' ? 'customers' : key === 'menuItems' ? 'menu' : key === 'openOrders' ? 'orders' : key === 'pendingReservations' ? 'reservations' : 'reviews')} />}
        {section === 'menu' && <MenuSection categories={data.menu?.categories || []} onRefresh={refreshMenu} notify={notify} />}
        {section === 'orders' && <OrdersSection data={data.orders?.records || []} pagination={data.orders?.pagination} onPageChange={(page) => setSectionPages((current) => ({ ...current, orders: page }))} refresh={() => refreshSection('orders')} notify={notify} />}
        {section === 'reservations' && <ReservationsSection data={data.reservations?.records || []} pagination={data.reservations?.pagination} onPageChange={(page) => setSectionPages((current) => ({ ...current, reservations: page }))} refresh={() => refreshSection('reservations')} notify={notify} />}
        {section === 'reviews' && <ReviewsManagement />}
        {section === 'customers' && <CustomersSection data={data.customers?.records || []} pagination={data.customers?.pagination} onPageChange={(page) => setSectionPages((current) => ({ ...current, customers: page }))} />}
        {section === 'gallery' && <GallerySection images={data.gallery?.images || []} refresh={() => refreshSection('gallery')} notify={notify} />}
        {section === 'content' && <ContentSection data={data.content || { content: [], banners: [] }} refresh={() => refreshSection('content')} notify={notify} />}
        {section === 'qr' && <QRSection />}
      </div>
    </main>
  )
}
