import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'

export default function ResetPassword() {
  const { t } = useTranslation()
  const { resetPassword, openAuthModal } = useAuth()
  const location = useLocation()
  const token = new URLSearchParams(location.search).get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!token || !/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(password)) {
      setError(t(!token ? 'passwordResetPage.invalidLink' : 'auth.passwordRequirements'))
      return
    }
    if (password !== confirmation) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      await resetPassword({ token, password })
      setSuccess(true)
    } catch (requestError) {
      setError(t(requestError.code === 'invalid_or_expired_token' ? 'passwordResetPage.invalidLink' : 'auth.genericError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="profile-page section-wrap">
      <section className="profile-settings password-reset-page">
        <p className="eyebrow"><span /> LUNA CAFÉ</p>
        <h1>{t('passwordResetPage.title')}</h1>
        {success ? (
          <>
            <p role="status">{t('passwordResetPage.success')}</p>
            <button type="button" className="button button--dark" onClick={() => openAuthModal('login', '/')}>{t('auth.login')}</button>
          </>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label className="auth-field"><span>{t('auth.password')}</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
            <label className="auth-field"><span>{t('auth.confirmPassword')}</span><input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required /></label>
            {error && <p className="auth-form__error" role="alert">{error}</p>}
            <button className="button button--dark auth-form__submit" disabled={busy || !token}>{busy ? t('auth.loading') : t('passwordResetPage.submit')}</button>
          </form>
        )}
      </section>
    </main>
  )
}
