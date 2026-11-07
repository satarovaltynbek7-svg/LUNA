import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    function updateVisibility() {
      setVisible(window.scrollY > 420)
    }
    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  if (!visible) return null

  return (
    <button className="back-to-top" type="button" aria-label={t('common.backToTop')} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <ArrowUp size={17} />
    </button>
  )
}