import { ArrowLeft, Coffee } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <main className="not-found">
      <Coffee size={27} strokeWidth={1.3} />
      <p className="eyebrow"><span /> {t('notFound.eyebrow')}</p>
      <p className="not-found__code">404</p>
      <h1>{t('notFound.titleLineOne')}<br /><em>{t('notFound.titleLineTwo')}</em></h1>
      <p className="not-found__copy">{t('notFound.copy')}</p>
      <Link className="button button--dark" to="/"><ArrowLeft size={15} /> {t('notFound.home')}</Link>
    </main>
  )
}