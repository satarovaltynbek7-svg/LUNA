import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Coffee } from 'lucide-react'

export default function CafeImage({ alt, className = '', ...imageProps }) {
  const [imageState, setImageState] = useState({ src: imageProps.src, status: 'loading' })
  const { t } = useTranslation()
  const status = imageState.src === imageProps.src ? imageState.status : 'loading'

  if (status === 'error') {
    return (
    <span className={`cafe-image-fallback ${className}`} role="img" aria-label={alt || t('common.imageUnavailable')}>
        <Coffee size={22} strokeWidth={1.3} />
        <span>LUNA CAFÉ</span>
      </span>
    )
  }

  return (
    <img
      {...imageProps}
      alt={alt}
      aria-label={status === 'loading' ? t('common.loading') : undefined}
      aria-busy={status === 'loading'}
      className={`cafe-image ${status === 'loading' ? 'cafe-image--loading' : 'cafe-image--ready'} ${className}`.trim()}
      loading={imageProps.loading ?? 'lazy'}
      decoding="async"
      onLoad={() => setImageState({ src: imageProps.src, status: 'loaded' })}
      onError={() => setImageState({ src: imageProps.src, status: 'error' })}
    />
  )
}