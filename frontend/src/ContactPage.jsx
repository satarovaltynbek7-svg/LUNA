import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ArrowUpRight, Check, Clock3, Instagram, MapPin, Phone } from 'lucide-react'
import { submitReservation } from './services/adminService.js'

const WHATSAPP_NUMBER = '996507113956'

function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

const initialForm = { name: '', phone: '', date: '', time: '', guests: '2', requests: '' }
const today = new Date()
const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

function ReservationForm() {
  const [form, setForm] = useState(initialForm)
  const [reservation, setReservation] = useState(null)
  const [reservationError, setReservationError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { t, i18n } = useTranslation()

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function handleFieldChange(event) {
    event.currentTarget.setCustomValidity('')
    updateForm(event)
  }

  function validateField(event) {
    const { validity } = event.currentTarget
    const key = validity.patternMismatch
      ? 'reservation.validation.phone'
      : validity.rangeUnderflow
        ? 'reservation.validation.date'
        : 'reservation.validation.required'
    event.currentTarget.setCustomValidity(t(key))
  }

  async function submitReservationForm(event) {
    event.preventDefault()
    setReservationError('')
    setSubmitting(true)
    try {
      await submitReservation({
        customerName: form.name,
        phone: form.phone,
        dateTime: new Date(`${form.date}T${form.time}:00`).toISOString(),
        guestCount: Number(form.guests),
        specialRequests: form.requests,
      })
      setReservation({ ...form })

      // Open WhatsApp with reservation details
      const msg = [
        '📅 Новая бронь LUNA Café',
        `👤 ${form.name}`,
        `📞 ${form.phone}`,
        `🕐 ${form.date} в ${form.time}`,
        `👥 Гостей: ${form.guests}`,
        form.requests ? `📝 ${form.requests}` : '',
      ].filter(Boolean).join('\n')
      openWhatsApp(msg)
    } catch {
      setReservationError(t('reservation.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setForm(initialForm)
    setReservation(null)
  }

  const reservationDate = reservation && (() => {
    const date = new Date(`${reservation.date}T12:00:00Z`)
    const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    return t('reservation.dateFormat', {
      weekday: t(`reservation.weekdays.${weekdays[date.getUTCDay()]}`),
      day: date.getUTCDate(),
      month: t(`reservation.months.${months[date.getUTCMonth()]}`),
    })
  })()

  return (
    <section className="reservation" id="reservation" aria-labelledby="reservation-title">
      <div className="reservation__intro">
        <p className="eyebrow"><span /> {t('reservation.eyebrow')}</p>
        <h2 id="reservation-title">{t('reservation.titleLineOne')}<br /><em>{t('reservation.titleLineTwo')}</em></h2>
        <p>{t('reservation.intro')}</p>
        <span className="reservation__aside">{t('reservation.aside')}</span>
      </div>
      <div className="reservation__form-wrap">
        {reservation ? (
          <div className="reservation-success" role="status" aria-live="polite">
            <span className="reservation-success__icon"><Check size={23} /></span>
            <p className="eyebrow"><span /> {t('reservation.successKicker', { name: reservation.name.split(' ')[0].toUpperCase() })}</p>
            <h3>{t('reservation.successTitleLineOne')}<br /><em>{t('reservation.successTitleLineTwo')}</em></h3>
            <p>{t('reservation.successMessage', { guests: t('reservation.guests', { count: Number(reservation.guests) }), date: reservationDate, time: reservation.time })}</p>
            <button className="text-link" type="button" onClick={resetForm}>{t('reservation.another')} <ArrowRight size={15} /></button>
          </div>
        ) : (
          <form className="reservation-form" onSubmit={submitReservationForm}>
            <div className="reservation-form__heading">
              <h3 id="reservation-form-title">{t('reservation.formTitle')}</h3>
              <span>{t('reservation.requiredLegend')}</span>
            </div>
            <label className="form-field form-field--wide">
              <span>{t('reservation.name')} <i>*</i></span>
              <input autoComplete="name" name="name" value={form.name} onChange={handleFieldChange} onInvalid={validateField} placeholder={t('reservation.namePlaceholder')} required maxLength={80} />
            </label>
            <label className="form-field">
              <span>{t('reservation.phone')} <i>*</i></span>
              <input autoComplete="tel" name="phone" type="tel" value={form.phone} onChange={handleFieldChange} onInvalid={validateField} placeholder={t('reservation.phonePlaceholder')} pattern="[0-9+ ]{7,18}" title={t('reservation.validation.phone')} required />
            </label>
            <label className="form-field">
              <span>{t('reservation.guestsLabel')} <i>*</i></span>
              <select name="guests" value={form.guests} onChange={handleFieldChange} onInvalid={validateField} required>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((number) => <option value={number} key={number}>{t('reservation.guests', { count: number })}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>{t('reservation.date')} <i>*</i></span>
              <input name="date" type="date" min={minimumDate} value={form.date} onChange={handleFieldChange} onInvalid={validateField} title={t('reservation.validation.date')} required />
            </label>
            <label className="form-field">
              <span>{t('reservation.time')} <i>*</i></span>
              <select name="time" value={form.time} onChange={handleFieldChange} onInvalid={validateField} required>
                <option value="" disabled>{t('reservation.chooseTime')}</option>
                {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time) => <option value={time} key={time}>{time}</option>)}
              </select>
            </label>
            <label className="form-field form-field--wide">
              <span>{t('reservation.specialRequests')} <small>{t('common.optional')}</small></span>
              <textarea name="requests" value={form.requests} onChange={handleFieldChange} placeholder={t('reservation.requestsPlaceholder')} rows="3" maxLength={400} />
            </label>
            {reservationError && <p className="auth-form__error" role="alert">{reservationError}</p>}
            <button className="button button--dark reservation-form__submit" type="submit" disabled={submitting}>{submitting ? t('common.loading') : t('reservation.submit')} <ArrowUpRight size={15} /></button>
            <p className="reservation-form__note">{t('reservation.privacyNote')}</p>
          </form>
        )}
      </div>
    </section>
  )
}

export default function ContactPage() {
  const { t } = useTranslation()
  return (
    <main className="contact-page editorial-page">
      <section className="contact-page__intro section-wrap">
        <p className="eyebrow"><span /> {t('contact.eyebrow')}</p>
        <h1>{t('contact.title')}</h1>
        <p>{t('contact.intro')}</p>
      </section>
      <section className="contact-details section-wrap" aria-label={t('contact.detailsLabel')}>
        <article className="contact-detail">
          <MapPin size={19} strokeWidth={1.5} />
          <p className="eyebrow">{t('contact.addressEyebrow')}</p>
          <h2>{t('contact.addressTitle')}</h2>
          <p>{t('footer.address')}<br />{t('contact.addressLine')}</p>
          <a href="https://maps.google.com/?q=18+Willow+Lane+Brooklyn+NY+11222">{t('contact.directions')} <ArrowUpRight size={14} /></a>
        </article>
        <article className="contact-detail">
          <Phone size={19} strokeWidth={1.5} />
          <p className="eyebrow">{t('contact.phoneEyebrow')}</p>
          <h2>{t('contact.phoneTitle')}</h2>
          <p>{t('contact.phoneCopy')}</p>
          <a href="tel:+17185550184">+1 (718) 555-0184 <ArrowUpRight size={14} /></a>
        </article>
        <article className="contact-detail">
          <Clock3 size={19} strokeWidth={1.5} />
          <p className="eyebrow">{t('contact.hoursEyebrow')}</p>
          <h2>{t('contact.hoursTitle')}</h2>
          <p>{t('footer.weekdays')}<br />{t('footer.weekends')}</p>
          <span>{t('contact.hoursNote')}</span>
        </article>
        <article className="contact-detail">
          <Instagram size={19} strokeWidth={1.5} />
          <p className="eyebrow">{t('contact.instagramEyebrow')}</p>
          <h2>{t('contact.instagramTitle')}</h2>
          <p>{t('contact.instagramCopy')}</p>
          <a href="https://www.instagram.com/">{t('contact.instagramHandle')} <ArrowUpRight size={14} /></a>
        </article>
      </section>
      <section className="map-section section-wrap" aria-label={t('contact.mapLabel')}>
        <div className="map-illustration" role="img" aria-label={t('contact.mapLabel')}>
          <span className="map-road map-road--one" />
          <span className="map-road map-road--two" />
          <span className="map-road map-road--three" />
          <span className="map-road map-road--four" />
          <span className="map-block map-block--one" />
          <span className="map-block map-block--two" />
          <span className="map-block map-block--three" />
          <span className="map-block map-block--four" />
          <span className="map-park">{t('contact.park')}</span>
          <span className="map-label map-label--one">{t('contact.streetOne')}</span>
          <span className="map-label map-label--two">{t('contact.streetTwo')}</span>
          <span className="map-pin"><MapPin size={22} fill="currentColor" /><span>LUNA CAFÉ</span></span>
        </div>
        <div className="map-caption">
          <div><p className="eyebrow"><span /> {t('contact.mapEyebrow')}</p><h2>{t('contact.mapTitleLineOne')}<br /><em>{t('contact.mapTitleLineTwo')}</em></h2></div>
          <p>{t('footer.address')}<br />{t('contact.addressLine')}</p>
        </div>
      </section>
      <div className="section-wrap"><ReservationForm /></div>
    </main>
  )
}