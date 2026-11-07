import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import CafeImage from './components/CafeImage.jsx'

const reasons = [
  { number: '01', key: 'details' },
  { number: '02', key: 'local' },
  { number: '03', key: 'welcome' },
]

export default function AboutPage() {
  const { t } = useTranslation()
  return (
    <main className="editorial-page about-page">
      <section className="editorial-hero section-wrap">
        <div className="editorial-hero__copy">
          <p className="eyebrow"><span /> {t('about.eyebrow')}</p>
          <h1>{t('about.titleLineOne')}<br /><em>{t('about.titleLineTwo')}</em></h1>
          <p className="editorial-hero__intro">{t('about.intro')}</p>
          <Link className="text-link" to="#our-story">{t('about.storyLink')} <ArrowDown size={15} /></Link>
        </div>
        <figure className="editorial-hero__image">
          <CafeImage src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1500&q=90" alt="The warm, sunlit interior of a neighborhood café" />
          <figcaption>{t('about.imageCaption')}</figcaption>
        </figure>
      </section>
      <section className="story-section" id="our-story">
        <div className="story-section__inner section-wrap">
          <div className="story-section__label"><p className="eyebrow"><span /> {t('about.storyEyebrow')}</p><span>{t('hero.index')}</span></div>
          <div className="story-section__content">
            <h2>{t('about.storyTitleLineOne')}<br /><em>{t('about.storyTitleLineTwo')}</em></h2>
            <div className="story-section__columns">
              <p>{t('about.storyParagraphOne')}</p>
              <p>{t('about.storyParagraphTwo')}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="philosophy-section section-wrap">
        <figure className="philosophy-section__image">
          <CafeImage src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1300&q=85" alt="A quiet corner of the café in the afternoon sun" />
        </figure>
        <div className="philosophy-section__copy">
          <p className="eyebrow"><span /> {t('about.philosophyEyebrow')}</p>
          <h2>{t('about.philosophyTitleLineOne')}<br /><em>{t('about.philosophyTitleLineTwo')}</em></h2>
          <p>{t('about.philosophyCopy')}</p>
          <Link className="text-link" to="/menu">{t('about.menuLink')} <ArrowUpRight size={15} /></Link>
        </div>
      </section>
      <section className="reasons-section">
        <div className="section-wrap">
          <div className="reasons-section__heading">
            <p className="eyebrow"><span /> {t('about.reasonsEyebrow')}</p>
            <h2>{t('about.reasonsTitleLineOne')}<br /><em>{t('about.reasonsTitleLineTwo')}</em></h2>
          </div>
          <div className="reasons-grid">
            {reasons.map((reason) => (
              <article className="reason" key={reason.number}>
                <span>{reason.number}</span>
                <h3>{t(`about.reasons.${reason.key}.title`)}</h3>
                <p>{t(`about.reasons.${reason.key}.copy`)}</p>
              </article>
            ))}
          </div>
          <Link className="text-link" to="/contact">{t('about.contactLink')} <ArrowRight size={15} /></Link>
        </div>
      </section>
    </main>
  )
}