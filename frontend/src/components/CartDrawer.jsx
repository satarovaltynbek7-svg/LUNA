import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import CafeImage from './CafeImage.jsx'

const formatPrice = (price, t, language) => {
  const locale = { ru: 'ru-RU', ky: 'ky-KG', en: 'en-US' }[language] || 'ru-RU'
  return t('common.price', { amount: new Intl.NumberFormat(locale).format(price) })
}

export default function CartDrawer() {
  const { cart, cartCount, cartTotal, cartOpen, closeCart, changeQuantity, removeItem, menuItems } = useCart()
  const { t, i18n } = useTranslation()
  const cartItems = menuItems.filter((item) => cart[item.id])

  useEffect(() => {
    if (!cartOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKeyDown(event) {
      if (event.key === 'Escape') closeCart()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [cartOpen, closeCart])

  if (!cartOpen) return null

  return (
    <div className="cart-layer">
      <button className="cart-layer__backdrop" type="button" aria-label={t('cart.close')} onClick={closeCart} />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="cart-drawer__heading">
          <div>
            <p className="eyebrow"><span /> {t('cart.eyebrow')}</p>
            <h2 id="cart-title">{t('cart.title')} <span>({t('cart.items', { count: cartCount })})</span></h2>
          </div>
          <button className="cart-drawer__close" type="button" aria-label={t('cart.close')} onClick={closeCart}><X size={20} /></button>
        </div>
        {cartItems.length ? (
          <>
            <div className="cart-drawer__items">
              {cartItems.map((item) => (
                <article className="cart-item" key={item.id}>
                  <CafeImage src={item.image} alt={item.names?.[i18n.resolvedLanguage] || t(item.nameKey)} />
                  <div className="cart-item__details">
                    <h3>{item.names?.[i18n.resolvedLanguage] || t(item.nameKey)}</h3>
                    <span>{formatPrice(item.price, t, i18n.resolvedLanguage)}</span>
                    <div className="cart-item__quantity">
                      <button type="button" aria-label={t('cart.decrease', { name: item.names?.[i18n.resolvedLanguage] || t(item.nameKey) })} onClick={() => changeQuantity(item.id, -1)}><Minus size={13} /></button>
                      <span>{cart[item.id]}</span>
                      <button type="button" aria-label={t('cart.increase', { name: item.names?.[i18n.resolvedLanguage] || t(item.nameKey) })} onClick={() => changeQuantity(item.id, 1)}><Plus size={13} /></button>
                    </div>
                  </div>
                  <div className="cart-item__actions">
                    <span className="cart-item__total">{formatPrice(item.price * cart[item.id], t, i18n.resolvedLanguage)}</span>
                    <button className="cart-item__remove" type="button" aria-label={t('cart.remove', { name: item.names?.[i18n.resolvedLanguage] || t(item.nameKey) })} onClick={() => removeItem(item)}><Trash2 size={14} /></button>
                  </div>
                </article>
              ))}
            </div>
            <div className="cart-drawer__summary">
              <div><span>{t('cart.subtotal')}</span><strong>{formatPrice(cartTotal, t, i18n.resolvedLanguage)}</strong></div>
              <div><span>{t('cart.total')}</span><strong>{formatPrice(cartTotal, t, i18n.resolvedLanguage)}</strong></div>
              <p>{t('cart.settleAtCafe')}</p>
              <Link className="button button--dark cart-drawer__checkout" to="/checkout" onClick={closeCart}>{t('cart.checkout')}</Link>
            </div>
          </>
        ) : (
          <div className="cart-drawer__empty">
            <ShoppingBag size={28} strokeWidth={1.3} />
            <p>{t('cart.emptyTitle')}</p>
            <span>{t('cart.emptyText')}</span>
            <Link className="cart-drawer__continue" to="/menu" onClick={closeCart}>{t('cart.continueShopping')}</Link>
          </div>
        )}
      </aside>
    </div>
  )
}