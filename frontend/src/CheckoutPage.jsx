import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCart } from './context/CartContext.jsx'
import { menuLabel } from './context/CatalogContext.jsx'
import { createCustomerOrder } from './services/adminService.js'

const WHATSAPP_NUMBER = '996507113956'

function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

const initialForm = { name: '', phone: '', address: '', note: '' }

function priceLabel(amount, language) {
  const locale = { ru: 'ru-RU', ky: 'ky-KG', en: 'en-US' }[language] || 'ru-RU'
  return `KGS ${new Intl.NumberFormat(locale).format(amount)}`
}

export default function CheckoutPage() {
  const { t, i18n } = useTranslation()
  const { cart, menuItems, cartTotal, clearCart } = useCart()
  const [form, setForm] = useState(initialForm)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const items = menuItems.filter((item) => cart[item.id])

  async function submitOrder(event) {
    event.preventDefault()
    if (submitting || !items.length) return
    setError('')
    setSubmitting(true)
    try {
      const result = await createCustomerOrder({
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        items: items.map((item) => ({
          itemId: item.slug || item.id,
          quantity: cart[item.id],
        })),
      })
      setOrder(result.order)
      setForm(initialForm)
      clearCart()
    } catch {
      setError(t('checkout.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (order) {
    return (
      <main className="checkout-page editorial-page">
        <section className="checkout-card checkout-card--success">
          <span className="checkout-success-icon"><Check size={22} /></span>
          <p className="eyebrow"><span /> {t('checkout.successKicker')}</p>
          <h1>{t('checkout.successTitle')}</h1>
          <p>{t('checkout.successMessage', { id: order.id })}</p>
          <strong>{priceLabel(order.total, i18n.resolvedLanguage)}</strong>
          <Link className="button button--dark" to="/menu">
            {t('checkout.backToMenu')} <ArrowUpRight size={15} />
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="checkout-page editorial-page">
      <section className="checkout-heading">
        <Link className="text-link" to="/menu"><ArrowLeft size={15} /> {t('checkout.backToMenu')}</Link>
        <p className="eyebrow"><span /> {t('checkout.eyebrow')}</p>
        <h1>{t('checkout.title')}</h1>
        <p>{t('checkout.subtitle')}</p>
      </section>

      {items.length ? (
        <div className="checkout-layout">
          <form className="checkout-card checkout-form" onSubmit={submitOrder}>
            <h2>{t('checkout.customerDetails')}</h2>
            <label className="form-field form-field--wide">
              <span>{t('checkout.name')} <i>*</i></span>
              <input autoComplete="name" name="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={100} />
            </label>
            <label className="form-field">
              <span>{t('checkout.phone')} <i>*</i></span>
              <input autoComplete="tel" name="phone" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} pattern="[0-9+ ]{7,24}" title={t('checkout.phoneHint')} required />
            </label>
            <label className="form-field form-field--wide">
              <span>{t('checkout.address')} <i>*</i></span>
              <textarea autoComplete="street-address" name="address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required maxLength={300} rows={3} />
            </label>
            <label className="form-field form-field--wide">
              <span>{t('checkout.note')} <small>{t('common.optional')}</small></span>
              <textarea name="note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} maxLength={500} rows={2} />
            </label>
            {error && <p className="checkout-error" role="alert">{error}</p>}
            <button className="button button--dark checkout-submit" type="submit" disabled={submitting}>
              {submitting ? t('common.loading') : t('checkout.submit')} <ArrowUpRight size={15} />
            </button>
          </form>

          <aside className="checkout-card checkout-summary">
            <h2>{t('checkout.orderSummary')}</h2>
            {items.map((item) => (
              <div className="checkout-line" key={item.id}>
                <span>{menuLabel(item, 'name', i18n.resolvedLanguage, t)} × {cart[item.id]}</span>
                <strong>{priceLabel(item.price * cart[item.id], i18n.resolvedLanguage)}</strong>
              </div>
            ))}
            <div className="checkout-total"><span>{t('cart.total')}</span><strong>{priceLabel(cartTotal, i18n.resolvedLanguage)}</strong></div>
            <p>{t('checkout.paymentNote')}</p>
          </aside>
        </div>
      ) : (
        <section className="checkout-card checkout-empty">
          <h2>{t('cart.emptyTitle')}</h2>
          <p>{t('cart.emptyText')}</p>
          <Link className="button button--dark" to="/menu">{t('cart.continueShopping')}</Link>
        </section>
      )}
    </main>
  )
}
