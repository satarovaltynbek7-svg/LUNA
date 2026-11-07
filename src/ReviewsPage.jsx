import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { useReviews } from './context/ReviewsContext.jsx'
import { deleteModeratedReview, fetchAdminReviews, updateModeratedReview } from './services/reviewService.js'

const localeCodes = { ru: 'ru-RU', ky: 'ky-KG', en: 'en-US' }

function dateValue(review) {
  if (review.createdAt?.toDate) return review.createdAt.toDate()
  return new Date(review.date || review.createdAt || 0)
}

function ReviewStars({ rating, label, size = 14 }) {
  return (
    <span className="review-stars" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} fill={star <= rating ? 'currentColor' : 'none'} strokeWidth={1.7} />
      ))}
    </span>
  )
}

function ReviewCard({ review }) {
  const { t, i18n } = useTranslation()
  const [avatarFailed, setAvatarFailed] = useState(false)
  const locale = localeCodes[i18n.resolvedLanguage] || 'ru-RU'
  const date = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(dateValue(review))
  const name = review.userName || review.name || ''
  const photo = review.userPhoto || review.avatar

  return (
    <article className="review-card">
      <div className="review-card__top">
        <div className="review-card__author">
          {photo && !avatarFailed
            ? <img src={photo} alt="" loading="lazy" onError={() => setAvatarFailed(true)} />
            : <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}
          <div><strong>{name}</strong><time dateTime={dateValue(review).toISOString()}>{date}</time></div>
        </div>
      </div>
      <ReviewStars rating={review.rating} label={t('reviews.ratingLabel', { rating: review.rating })} />
      <p className="review-card__text">{review.text}</p>
    </article>
  )
}

function DataMessage({ error, loading }) {
  const { t } = useTranslation()
  if (loading) return <p className="reviews-data-message" role="status">{t('reviews.loading')}</p>
  if (error) return <p className="reviews-data-message reviews-data-message--error" role="alert">{t(error === 'api_unavailable' ? 'auth.apiUnavailable' : 'reviews.loadError')}</p>
  return null
}

function RatingSummary({ summary }) {
  const { t } = useTranslation()
  const total = summary.total
  const average = summary.average

  return (
    <section className="reviews-summary" aria-label={t('reviews.summaryLabel')}>
      <div className="reviews-summary__score">
        <strong>{average.toFixed(1)}</strong>
        <ReviewStars rating={Math.round(average)} label={t('reviews.ratingLabel', { rating: Math.round(average) })} size={16} />
        <span>{t('reviews.reviewCount', { count: total })}</span>
      </div>
      <div className="reviews-summary__bars">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = summary.distribution[rating] || 0
          const percent = total ? (count / total) * 100 : 0
          return (
            <div className="reviews-summary__bar" key={rating}>
              <span>{rating} <Star size={10} fill="currentColor" /></span>
              <div><i style={{ width: `${percent}%` }} /></div>
              <small>{count}</small>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function FeaturedReviews() {
  const { t } = useTranslation()
  const { user, openAuthModal } = useAuth()
  const navigate = useNavigate()
  const { featuredReviews, loading, error } = useReviews()

  return (
    <section className="reviews-featured">
      <div className="section-wrap">
        <div className="reviews-heading">
          <div><p className="eyebrow"><span /> {t('reviews.homeEyebrow')}</p><h2>{t('reviews.homeTitle')}</h2><p>{t('reviews.homeSubtitle')}</p></div>
          <div className="reviews-heading__actions">
            <button type="button" className="reviews-write-link" onClick={() => {
              if (user) navigate('/reviews#write-review')
              else openAuthModal('login', '/reviews#write-review')
            }}>{t('reviews.writeReview')}</button>
            <Link className="text-link reviews-heading__link" to="/reviews">{t('reviews.readAll')} <ArrowRight size={15} /></Link>
          </div>
        </div>
        <DataMessage loading={loading} error={error} />
        {!loading && !error && featuredReviews.length > 0 && (
          <div className="reviews-grid">
            {featuredReviews.slice(0, 3).map((review) => <ReviewCard key={review.id} review={review} />)}
          </div>
        )}
        {!loading && !error && featuredReviews.length === 0 && <p className="reviews-data-message">{t('reviews.emptyFeatured')}</p>}
      </div>
    </section>
  )
}

function ReviewForm() {
  const { t } = useTranslation()
  const { user, loading, configured, openAuthModal } = useAuth()
  const { addReview } = useReviews()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submitReview(event) {
    event.preventDefault()
    setError('')
    setSuccess(false)
    if (!user || loading) {
      if (loading) return
      openAuthModal('login', '/reviews#write-review')
      return
    }
    if (!rating || text.trim().length < 10 || text.trim().length > 1000) {
      setError(t('reviews.validationError'))
      return
    }
    setBusy(true)
    try {
      await addReview({ rating, text })
      setRating(0)
      setText('')
      setSuccess(true)
    } catch (submitError) {
      if (['authentication_required', 'invalid_session'].includes(submitError.code)) {
        openAuthModal('login', '/reviews#write-review')
        return
      }
      setError(t('reviews.submitError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="review-form-section" id="write-review">
      <div className="review-form-section__intro">
        <p className="eyebrow"><span /> {t('reviews.formEyebrow')}</p>
        <h2>{t('reviews.formTitle')}</h2>
        <p>{t(user ? 'reviews.formIntro' : 'reviews.loginToReview')}</p>
      </div>
      {loading ? (
        <p className="reviews-data-message" role="status">{t('auth.loading')}</p>
      ) : !user ? (
        <div className="review-form__signed-out">
          <p>{t('reviews.authRequired')}</p>
          <button type="button" className="button button--dark" onClick={() => openAuthModal('login', '/reviews#write-review')}>
            {t('reviews.writeReview')} <ArrowRight size={15} />
          </button>
          {!configured && <small>{t('auth.apiUnavailable')}</small>}
        </div>
      ) : (
        <form className="review-form" onSubmit={submitReview} noValidate>
          <div className="review-form__identity">
            {user.photoURL ? <img src={user.photoURL} alt="" /> : <span>{(user.displayName || user.email || '').slice(0, 1).toUpperCase()}</span>}
            <div><strong>{user.displayName}</strong><small>{t('reviews.postingAs')}</small></div>
          </div>
          <fieldset className="review-form__rating">
            <legend>{t('reviews.ratingLabelShort')} <i>*</i></legend>
            <div role="group" aria-label={t('reviews.ratingLabelShort')}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  aria-label={t('reviews.ratingOption', { rating: star })}
                  aria-pressed={rating === star}
                  className={star <= rating ? 'review-form__star review-form__star--active' : 'review-form__star'}
                  onClick={() => { setRating(star); setError(''); setSuccess(false) }}
                ><Star size={27} fill={star <= rating ? 'currentColor' : 'none'} /></button>
              ))}
            </div>
          </fieldset>
          <label className="review-form__field review-form__field--wide">
            <span>{t('reviews.textLabel')}</span>
            <textarea value={text} onChange={(event) => { setText(event.target.value); setSuccess(false) }} placeholder={t('reviews.textPlaceholder')} rows={5} minLength={10} maxLength={1000} required />
            <small>{text.length} / 1000</small>
          </label>
          {error && <p className="review-form__message review-form__message--error" role="alert">{error}</p>}
          {success && <p className="review-form__message" role="status"><Check size={15} /> {t('reviews.pendingSuccess')}</p>}
          <button className="button button--dark review-form__submit" type="submit" disabled={busy || !configured}>
            {busy ? t('reviews.submitting') : t('reviews.submit')}
          </button>
          {!configured && <p className="review-form__message review-form__message--error">{t('auth.apiUnavailable')}</p>}
        </form>
      )}
    </section>
  )
}

function reviewErrorText(error, t) {
  return error === 'admin_required' || error === 'authentication_required' ? t('reviews.adminPermission')
    : error === 'api_unavailable' ? t('auth.apiUnavailable')
      : t('reviews.loadError')
}

export function ReviewsManagement() {
  const { t, i18n } = useTranslation()
  const { user, isAdmin, configured } = useAuth()
  const { refreshReviews } = useReviews()
  const [reviews, setReviews] = useState([])
  const [ratingFilter, setRatingFilter] = useState('all')
  const [adminPage, setAdminPage] = useState(1)
  const [adminPagination, setAdminPagination] = useState({ page: 1, pages: 0 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    if (!configured || !user || !isAdmin) return undefined
    const controller = new AbortController()
    setLoading(true)
    fetchAdminReviews({
      page: adminPage,
      limit: 20,
      rating: ratingFilter === 'all' ? undefined : Number(ratingFilter),
      signal: controller.signal,
    }).then((result) => {
      setReviews(result.reviews)
      setAdminPagination(result.pagination)
      setError('')
    }).catch((subscriptionError) => {
      if (!controller.signal.aborted) setError(subscriptionError.code || 'request_failed')
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [configured, user, isAdmin, ratingFilter, adminPage])

  if (!user || !isAdmin) {
    return <section className="reviews-admin" id="reviews-admin"><p className="eyebrow"><span /> {t('reviews.adminEyebrow')}</p><h2>{t('reviews.adminTitle')}</h2><p className="reviews-admin__note">{t('reviews.adminPermission')}</p></section>
  }

  const visibleReviews = reviews

  async function moderate(review, changes) {
    setBusyId(review.id)
    setError('')
    try {
      const result = await updateModeratedReview(review.id, changes)
      setReviews((current) => current.map((item) => item.id === review.id
        ? { ...item, status: result.status, featured: result.featured }
        : item))
      await refreshReviews()
    } catch (actionError) {
      setError(actionError.code || actionError.message || 'request_failed')
    } finally {
      setBusyId('')
    }
  }

  async function remove(review) {
    setBusyId(review.id)
    setError('')
    try {
      await deleteModeratedReview(review.id)
      setReviews((current) => current.filter((item) => item.id !== review.id))
      await refreshReviews()
    } catch (actionError) {
      setError(actionError.code || actionError.message || 'request_failed')
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className="reviews-admin" id="reviews-admin">
      <div className="reviews-admin__heading">
        <div><p className="eyebrow"><span /> {t('reviews.adminEyebrow')}</p><h2>{t('reviews.adminTitle')}</h2></div>
        <label><span>{t('reviews.filterRating')}</span>
          <select value={ratingFilter} onChange={(event) => {
            setRatingFilter(event.target.value)
            setAdminPage(1)
          }}>
            <option value="all">{t('reviews.allRatings')}</option>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{t('reviews.ratingOption', { rating })}</option>)}
          </select>
        </label>
      </div>
      <p className="reviews-admin__note">{t('reviews.adminNote')}</p>
      {error && <p className="review-form__message review-form__message--error" role="alert">{reviewErrorText(error, t)}</p>}
      {loading && <DataMessage loading />}
      <div className="reviews-admin__list">
        {visibleReviews.map((review) => (
          <article className={`reviews-admin__item${review.status === 'approved' ? '' : ' reviews-admin__item--hidden'}`} key={review.id}>
            <div className="reviews-admin__item-copy">
              <div className="reviews-admin__item-title">
                <strong>{review.userName}</strong>
                <ReviewStars rating={review.rating} label={t('reviews.ratingLabel', { rating: review.rating })} />
                <time dateTime={dateValue(review).toISOString()}>{new Intl.DateTimeFormat(localeCodes[i18n.resolvedLanguage] || 'ru-RU', { dateStyle: 'medium' }).format(dateValue(review))}</time>
              </div>
              <p>{review.text}</p>
              <small>{t(`profile.status.${review.status}`)}{review.featured ? ` · ${t('reviews.featured')}` : ''}</small>
            </div>
            <div className="reviews-admin__actions">
              {review.status !== 'approved' && <button type="button" disabled={busyId === review.id} onClick={() => moderate(review, { status: 'approved' })}>{t('reviews.approve')}</button>}
              {review.status !== 'rejected' && <button type="button" disabled={busyId === review.id} onClick={() => moderate(review, { status: 'rejected' })}>{t('reviews.reject')}</button>}
              {review.status === 'approved' && <button type="button" disabled={busyId === review.id} onClick={() => moderate(review, { featured: !review.featured })}>
                {review.featured ? t('reviews.unfeature') : t('reviews.feature')}
              </button>}
              <button type="button" className="reviews-admin__delete" disabled={busyId === review.id} onClick={() => remove(review)}>{t('reviews.delete')}</button>
            </div>
          </article>
        ))}
        {!loading && !visibleReviews.length && <p className="reviews-admin__empty">{t('reviews.noReviews')}</p>}
      </div>
      {adminPagination.pages > 1 && <div className="reviews-pagination">
        <button type="button" disabled={loading || adminPage <= 1} onClick={() => setAdminPage((page) => page - 1)}>{t('reviews.previousPage')}</button>
        <span>{t('reviews.pageNumber', { page: adminPage, pages: adminPagination.pages })}</span>
        <button type="button" disabled={loading || adminPage >= adminPagination.pages} onClick={() => setAdminPage((page) => page + 1)}>{t('reviews.nextPage')}</button>
      </div>}
    </section>
  )
}

export default function ReviewsPage() {
  const { t } = useTranslation()
  const { reviews, summary, pagination, loading, error, loadPage } = useReviews()
  const [ratingFilter, setRatingFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const displayedReviews = useMemo(() => {
    const filtered = ratingFilter === 'all' ? [...reviews] : reviews.filter((review) => review.rating === Number(ratingFilter))
    filtered.sort((a, b) => {
      if (sort === 'highest') return b.rating - a.rating || dateValue(b) - dateValue(a)
      if (sort === 'lowest') return a.rating - b.rating || dateValue(b) - dateValue(a)
      return dateValue(b) - dateValue(a)
    })
    return filtered
  }, [reviews, ratingFilter, sort])

  return (
    <main className="reviews-page">
      <section className="reviews-page__hero">
        <div className="section-wrap">
          <p className="eyebrow"><span /> {t('reviews.eyebrow')}</p>
          <h1>{t('reviews.titleLineOne')}<br /><em>{t('reviews.titleLineTwo')}</em></h1>
          <p>{t('reviews.subtitle')}</p>
          <Link className="button button--dark" to="#write-review">{t('reviews.writeReview')} <ArrowRight size={15} /></Link>
        </div>
      </section>
      <div className="section-wrap reviews-page__body">
        <RatingSummary summary={summary} />
        <div className="reviews-list-heading">
          <div><p className="eyebrow"><span /> {t('reviews.listEyebrow')}</p><h2>{t('reviews.allTitle')}</h2></div>
          <div className="reviews-controls">
            <label><span>{t('reviews.filterRating')}</span>
              <select value={ratingFilter} onChange={(event) => {
                const nextRating = event.target.value
                setRatingFilter(nextRating)
                loadPage({ page: 1, rating: nextRating === 'all' ? undefined : Number(nextRating), sort })
              }}>
                <option value="all">{t('reviews.allRatings')}</option>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{t('reviews.ratingOption', { rating })}</option>)}
              </select>
            </label>
            <label><span>{t('reviews.sortBy')}</span>
              <select value={sort} onChange={(event) => {
                const nextSort = event.target.value
                setSort(nextSort)
                loadPage({ page: 1, rating: ratingFilter === 'all' ? undefined : Number(ratingFilter), sort: nextSort })
              }}>
                <option value="newest">{t('reviews.newest')}</option>
                <option value="highest">{t('reviews.highest')}</option>
                <option value="lowest">{t('reviews.lowest')}</option>
              </select>
            </label>
          </div>
        </div>
        <DataMessage loading={loading} error={error} />
        {!loading && !error && (
          <div className="reviews-grid reviews-grid--all">
            {displayedReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
            {!displayedReviews.length && <p className="reviews-admin__empty">{t('reviews.emptyApproved')}</p>}
          </div>
        )}
        {pagination.page < pagination.pages && <button
          type="button"
          className="button button--dark reviews-load-more"
          disabled={loading}
          onClick={() => loadPage({
            page: pagination.page + 1,
            rating: ratingFilter === 'all' ? undefined : Number(ratingFilter),
            sort,
            append: true,
          })}
        >{loading ? t('reviews.loading') : t('reviews.loadMore')}</button>}
        <ReviewForm />
      </div>
    </main>
  )
}
