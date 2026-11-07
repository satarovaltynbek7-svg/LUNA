import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { GALLERY_CATEGORIES, GALLERY_ITEMS } from './data/galleryItems.js'
import CafeImage from './components/CafeImage.jsx'
import { apiRequest } from './services/apiClient.js'

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeImage, setActiveImage] = useState(null)
  const [images, setImages] = useState(GALLERY_ITEMS)
  const [galleryError, setGalleryError] = useState(false)
  const { t, i18n } = useTranslation()
  const galleryItems = useMemo(() => images.map((image) => ({
    ...image,
    image: image.imageUrl || image.image,
  })), [images])
  const visibleImages = galleryItems
    .map((item, index) => ({ ...item, index }))
    .filter((item) => activeCategory === 'all' || item.category === activeCategory)

  useEffect(() => {
    const controller = new AbortController()
    apiRequest('/gallery', { signal: controller.signal }).then(({ images: records }) => {
      setImages(records)
      setGalleryError(false)
    }).catch((error) => {
      if (!controller.signal.aborted) setGalleryError(true)
    })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (activeImage === null) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') setActiveImage(null)
      if (event.key === 'ArrowRight') setActiveImage((current) => (current + 1) % galleryItems.length)
      if (event.key === 'ArrowLeft') setActiveImage((current) => (current - 1 + galleryItems.length) % galleryItems.length)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeImage, galleryItems.length])

  function moveLightbox(direction) {
    setActiveImage((current) => (current + direction + galleryItems.length) % galleryItems.length)
  }

  const selectedImage = activeImage === null ? null : galleryItems[activeImage]
  const imageCaption = (item) => item.captions?.[i18n.resolvedLanguage] || item.captions?.en || t(item.captionKey)
  const imageAlt = (item) => item.altTexts?.[i18n.resolvedLanguage] || item.altTexts?.en || t(item.altKey)

  return (
    <main className="gallery-page editorial-page">
      <div className="gallery-page__intro section-wrap">
        <p className="eyebrow"><span /> {t('gallery.eyebrow')}</p>
        <div className="gallery-page__title-row">
          <div>
            <h1>{t('gallery.title')}</h1>
            <p>{t('gallery.subtitle')}</p>
          </div>
          <span className="gallery-page__count">{t('gallery.count', { count: String(galleryItems.length).padStart(2, '0') })}</span>
        </div>
      </div>
      <section className="gallery-browser section-wrap" aria-label={t('gallery.browserLabel')}>
        {galleryError && <p className="reviews-data-message" role="status">{t('adminPanel.publicFallback')}</p>}
        <div className="gallery-filters" role="group" aria-label={t('gallery.filtersLabel')}>
          {GALLERY_CATEGORIES.map((category) => (
            <button
              className={`gallery-filter${activeCategory === category ? ' gallery-filter--active' : ''}`}
              type="button"
              key={category}
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {t(`gallery.categories.${category}`)}
            </button>
          ))}
        </div>
        <div className="gallery-masonry">
          {visibleImages.map((item, index) => (
            <button
              className={`gallery-tile gallery-tile--${index % 3 + 1}`}
              key={item.id || item.captionKey}
              type="button"
              onClick={() => setActiveImage(item.index)}
              aria-label={t('gallery.openPhoto', { caption: imageCaption(item) })}
            >
              <CafeImage src={item.image} alt={imageAlt(item)} />
              <span className="gallery-tile__caption"><span>{imageCaption(item)}</span><span>{t(`gallery.categories.${item.category}`)}</span></span>
            </button>
          ))}
        </div>
      </section>
      {selectedImage && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={t('gallery.dialogLabel')} onClick={() => setActiveImage(null)}>
          <button className="lightbox__close" type="button" aria-label={t('gallery.closePhoto')} onClick={() => setActiveImage(null)}><X size={21} /></button>
          <button className="lightbox__arrow lightbox__arrow--left" type="button" aria-label={t('gallery.previousPhoto')} onClick={(event) => { event.stopPropagation(); moveLightbox(-1) }}><ArrowLeft size={20} /></button>
          <figure className="lightbox__figure" onClick={(event) => event.stopPropagation()}>
            <CafeImage src={selectedImage.image} alt={imageAlt(selectedImage)} loading="eager" />
            <figcaption><span>{imageCaption(selectedImage)}</span><span>{String(activeImage + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}</span></figcaption>
          </figure>
          <button className="lightbox__arrow lightbox__arrow--right" type="button" aria-label={t('gallery.nextPhoto')} onClick={(event) => { event.stopPropagation(); moveLightbox(1) }}><ArrowRight size={20} /></button>
        </div>
      )}
    </main>
  )
}