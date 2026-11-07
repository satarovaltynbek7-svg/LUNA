import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCart } from '../context/CartContext.jsx'

export default function Toast() {
  const { toast, dismissToast } = useCart()
  const { t } = useTranslation()
  if (!toast) return null
  const values = toast.values?.nameKey
    ? { name: t(toast.values.nameKey) }
    : toast.values

  return (
    <div className="toast" key={toast.id} role="status" aria-live="polite">
      <span className="toast__icon"><Check size={15} /></span>
      <span>{t(toast.key, values)}</span>
      <button type="button" aria-label={t('notifications.dismiss')} onClick={dismissToast}><X size={15} /></button>
    </div>
  )
}