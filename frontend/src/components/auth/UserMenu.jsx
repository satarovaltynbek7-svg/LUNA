import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, LogOut, Settings, Star, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function UserMenu() {
  const { t } = useTranslation()
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [error, setError] = useState(false)
  const rootRef = useRef(null)
  const name = profile?.displayName || user?.displayName || user?.email || ''
  const photo = profile?.photoURL || user?.photoURL

  useEffect(() => {
    function closeOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [])

  async function signOut() {
    try {
      await logout()
      setOpen(false)
      navigate('/')
    } catch {
      setError(true)
    }
  }

  return (
    <div className="user-menu" ref={rootRef}>
      <button className="user-menu__trigger" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {photo && !avatarError ? <img src={photo} alt="" onError={() => setAvatarError(true)} /> : <span className="user-menu__fallback"><UserRound size={17} /></span>}
        <span className="user-menu__name">{name}</span><ChevronDown size={14} />
      </button>
      {open && (
        <div className="user-menu__dropdown">
          <Link to="/profile" onClick={() => setOpen(false)}><UserRound size={15} />{t('auth.profile')}</Link>
          <Link to="/profile#my-reviews" onClick={() => setOpen(false)}><Star size={15} />{t('auth.myReviews')}</Link>
          <Link to="/profile#settings" onClick={() => setOpen(false)}><Settings size={15} />{t('auth.settings')}</Link>
          {error && <p role="alert">{t('auth.signOutError')}</p>}
          <button type="button" onClick={signOut}><LogOut size={15} />{t('auth.logout')}</button>
        </div>
      )}
    </div>
  )
}
