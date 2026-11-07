import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { deleteOwnReview, fetchUserReviews, updateOwnReview } from '../services/reviewService.js'

function ProfileReview({ review, onDelete, onEdit }) {
  const { t, i18n } = useTranslation()
  const statusKey = `profile.status.${review.status}`
  const date = review.createdAt?.toDate ? review.createdAt.toDate() : new Date(review.createdAt || review.date || 0)
  return (
    <article className="profile-review">
      <div className="profile-review__rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
      <p>{review.text}</p>
      <div className="profile-review__meta">
        <span>{t(statusKey)}</span>
        <time dateTime={date.toISOString()}>{new Intl.DateTimeFormat({ ru: 'ru-RU', ky: 'ky-KG', en: 'en-US' }[i18n.resolvedLanguage] || 'ru-RU').format(date)}</time>
        {review.status === 'pending' && <button type="button" onClick={() => onEdit(review)}>{t('profile.editReview')}</button>}
        <button type="button" aria-label={t('profile.deleteReview')} onClick={() => onDelete(review)}><Trash2 size={14} /></button>
      </div>
    </article>
  )
}

export default function Profile() {
  const { t, i18n } = useTranslation()
  const { user, profile, profileError, loading, openAuthModal } = useAuth()
  const [reviews, setReviews] = useState([])
  const [reviewError, setReviewError] = useState('')
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [editRating, setEditRating] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return undefined
    const controller = new AbortController()
    fetchUserReviews({ limit: 100, signal: controller.signal }).then((result) => {
      setReviews(result.reviews)
      setReviewError('')
    }).catch(() => {
      if (!controller.signal.aborted) setReviewError(t('profile.loadError'))
    })
    return () => controller.abort()
  }, [user, t])

  if (loading) return <main className="profile-page"><p>{t('auth.loading')}</p></main>
  if (!user) {
    return (
      <main className="profile-page">
        <h1>{t('profile.loginRequired')}</h1>
        <button className="button button--dark" type="button" onClick={() => openAuthModal('login', '/profile')}>{t('auth.login')}</button>
      </main>
    )
  }

  const joined = profile?.createdAt?.toDate ? profile.createdAt.toDate() : user.metadata.creationTime ? new Date(user.metadata.creationTime) : null
  const joinedText = joined
    ? new Intl.DateTimeFormat({ ru: 'ru-RU', ky: 'ky-KG', en: 'en-US' }[i18n.resolvedLanguage] || 'ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }).format(joined)
    : t('profile.notAvailable')

  async function deleteReview(review) {
    setBusy(true)
    setReviewError('')
    try {
      await deleteOwnReview(review.id)
      setReviews((current) => current.filter((item) => item.id !== review.id))
    } catch {
      setReviewError(t('profile.actionError'))
    } finally {
      setBusy(false)
    }
  }

  function beginEdit(review) {
    setEditing(review)
    setEditText(review.text)
    setEditRating(review.rating)
  }

  async function saveEdit(event) {
    event.preventDefault()
    if (!editing || editText.trim().length < 10) return
    setBusy(true)
    try {
      const { review } = await updateOwnReview(editing.id, { text: editText.trim(), rating: editRating })
      setReviews((current) => current.map((item) => item.id === review.id ? review : item))
      setEditing(null)
    } catch {
      setReviewError(t('profile.actionError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="profile-page section-wrap">
      <section className="profile-card">
        {user.photoURL ? <img src={user.photoURL} alt="" /> : <span><UserRound size={34} /></span>}
        <div><p className="eyebrow"><span /> {t('profile.eyebrow')}</p><h1>{profile?.displayName || user.displayName}</h1><p>{user.email}</p><small>{t('profile.memberSince', { date: joinedText })}</small></div>
      </section>
      {profileError && <p className="auth-form__error" role="alert">{t(profileError === 'api_unavailable' ? 'auth.apiUnavailable' : 'profile.loadError')}</p>}
      <section className="profile-reviews" id="my-reviews">
        <div className="reviews-list-heading"><div><p className="eyebrow"><span /> {t('auth.myReviews')}</p><h2>{t('profile.reviewsTitle')}</h2></div></div>
        {reviewError && <p className="auth-form__error" role="alert">{reviewError}</p>}
        {reviews.map((review) => <ProfileReview key={review.id} review={review} onDelete={deleteReview} onEdit={beginEdit} />)}
        {!reviews.length && <p className="profile-reviews__empty">{t('profile.emptyReviews')}</p>}
      </section>
      <div id="settings" className="profile-settings"><h2>{t('auth.settings')}</h2><p>{t('profile.settingsCopy')}</p></div>
      {editing && (
        <div className="auth-overlay">
          <form className="auth-modal profile-edit" onSubmit={saveEdit}>
            <h2>{t('profile.editReview')}</h2>
            <label className="auth-field"><span>{t('reviews.ratingLabelShort')}</span><select value={editRating} onChange={(event) => setEditRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{t('reviews.ratingOption', { rating })}</option>)}</select></label>
            <label className="auth-field"><span>{t('reviews.textLabel')}</span><textarea value={editText} onChange={(event) => setEditText(event.target.value)} minLength={10} maxLength={1000} required /></label>
            <button className="button button--dark auth-form__submit" disabled={busy}>{t('profile.saveReview')}</button>
            <button className="auth-form__forgot" type="button" onClick={() => setEditing(null)}>{t('auth.close')}</button>
          </form>
        </div>
      )}
    </main>
  )
}
