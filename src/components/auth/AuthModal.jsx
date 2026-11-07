import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

function authErrorKey(error) {
  const code = error?.code || error?.message
  if (code === 'api_unavailable') return 'auth.apiUnavailable'
  if (code === 'email_in_use') return 'auth.emailInUse'
  if (code === 'invalid_credentials') return 'auth.invalidCredentials'
  if (code === 'too_many_requests') return 'auth.tooManyRequests'
  if (code === 'password_reset_unavailable') return 'auth.passwordResetUnavailable'
  if (code === 'google_login_unavailable') return 'auth.googleUnavailable'
  if (code?.startsWith('google_')) return 'auth.googleFailed'
  return 'auth.genericError'
}

function PasswordField({ label, value, onChange, autoComplete, t }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-field__input">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
        />
        <button type="button" aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')} onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  )
}

export default function AuthModal() {
  const { t } = useTranslation()
  const { modal, redirectError, closeAuthModal, completeAuthentication, configured, login, register, loginGoogle, sendPasswordReset } = useAuth()
  const [mode, setMode] = useState(modal?.mode || 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setMode(modal?.mode || 'login')
    setError(redirectError ? t(authErrorKey({ code: redirectError })) : '')
  }, [modal?.mode, redirectError, t])

  if (!modal) return null

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!configured) {
      setError(t('auth.apiUnavailable'))
      return
    }

    if (mode === 'register') {
      if (!name.trim() || !email.trim() || !password || !confirmation) {
        setError(t('auth.requiredFields'))
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError(t('auth.invalidEmail'))
        return
      }
      if (!/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(password)) {
        setError(t('auth.passwordRequirements'))
        return
      }
      if (password !== confirmation) {
        setError(t('auth.passwordMismatch'))
        return
      }
    } else if (!email.trim() || (mode !== 'forgot' && !password)) {
      setError(t('auth.requiredFields'))
      return
    }

    setBusy(true)
    try {
      if (mode === 'register') {
        await register({ fullName: name, email: email.trim(), password })
        await completeAuthentication('auth.registrationSuccess')
      } else if (mode === 'login') {
        await login({ email: email.trim(), password })
        await completeAuthentication('auth.loginSuccess')
      } else {
        await sendPasswordReset(email.trim())
        setNotice(t('auth.resetSent'))
      }
    } catch (submissionError) {
      setError(t(authErrorKey(submissionError)))
    } finally {
      setBusy(false)
    }
  }

  async function googleSignIn() {
    setError('')
    if (!configured) {
      setError(t('auth.apiUnavailable'))
      return
    }
    setBusy(true)
    try {
      loginGoogle()
    } catch (googleError) {
      setError(t(authErrorKey(googleError)))
    } finally {
      setBusy(false)
    }
  }

  const headingKey = mode === 'register' ? 'auth.registerTitle' : mode === 'forgot' ? 'auth.forgotTitle' : 'auth.loginTitle'

  return (
    <div className="auth-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAuthModal() }}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button className="auth-modal__close" type="button" aria-label={t('auth.close')} onClick={closeAuthModal}><X size={19} /></button>
        <p className="eyebrow"><span /> LUNA CAFÉ</p>
        <h2 id="auth-modal-title">{t(headingKey)}</h2>
        {mode !== 'forgot' && (
          <div className="auth-modal__tabs">
            <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setError(''); setNotice('') }}>{t('auth.login')}</button>
            <button type="button" className={mode === 'register' ? 'is-active' : ''} onClick={() => { setMode('register'); setError(''); setNotice('') }}>{t('auth.register')}</button>
          </div>
        )}
        {mode === 'forgot' && <p className="auth-modal__copy">{t('auth.forgotIntro')}</p>}
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label className="auth-field">
              <span>{t('auth.fullName')}</span>
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} required />
            </label>
          )}
          <label className="auth-field">
            <span>{t('auth.email')}</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </label>
          {mode !== 'forgot' && <PasswordField label={t('auth.password')} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} t={t} />}
          {mode === 'register' && <PasswordField label={t('auth.confirmPassword')} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" t={t} />}
          {mode === 'login' && <button className="auth-form__forgot" type="button" onClick={() => { setMode('forgot'); setError(''); setNotice('') }}>{t('auth.forgotPassword')}</button>}
          {error && <p className="auth-form__error" role="alert">{error}</p>}
          {notice && <p className="auth-form__notice" role="status">{notice}</p>}
          <button className="button button--dark auth-form__submit" type="submit" disabled={busy}>
            {busy ? <span className="auth-spinner" aria-label={t('auth.loading')} /> : null}
            {mode === 'register' ? t('auth.register') : mode === 'forgot' ? t('auth.sendReset') : t('auth.login')}
          </button>
        </form>
        {mode !== 'forgot' && (
          <>
            <div className="auth-modal__separator"><span />{t('auth.or')}<span /></div>
            <button type="button" className="auth-google" onClick={googleSignIn} disabled={busy}>
              <span aria-hidden="true">G</span>{t('auth.google')}
            </button>
          </>
        )}
        {mode === 'forgot' && <button className="auth-form__forgot" type="button" onClick={() => setMode('login')}>{t('auth.backToLogin')}</button>}
      </section>
    </div>
  )
}
