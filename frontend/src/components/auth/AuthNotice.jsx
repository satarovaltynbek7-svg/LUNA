import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext.jsx'

export default function AuthNotice() {
  const { t } = useTranslation()
  const { notice, dismissNotice } = useAuth()
  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(dismissNotice, 5000)
    return () => window.clearTimeout(timer)
  }, [notice, dismissNotice])

  if (!notice) return null

  return (
    <div className="auth-notice" role="status">
      <span><Check size={15} /></span>
      {t(notice)}
      <button type="button" aria-label={t('auth.close')} onClick={dismissNotice}><X size={15} /></button>
    </div>
  )
}
