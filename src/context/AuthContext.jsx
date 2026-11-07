import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword, fetchCurrentUser, loginWithEmail, loginWithGoogle, registerWithEmail, resetPassword, signOutUser } from '../services/authService.js'

const AuthContext = createContext(null)
const OWNER_EMAIL = 'asema008@gmail.com'

function adaptUser(user) {
  if (!user) return null
  return {
    ...user,
    displayName: user.fullName,
    photoURL: user.avatar,
    metadata: { creationTime: user.createdAt },
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [modal, setModal] = useState(null)
  const [redirectError, setRedirectError] = useState('')
  const [notice, setNotice] = useState('')

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser()
      setUser(adaptUser(currentUser))
      setApiError('')
      return currentUser
    } catch (error) {
      if (error.status === 401) {
        setUser(null)
        setApiError('')
        return null
      }
      setApiError(error.code || 'api_unavailable')
      throw error
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'success') setNotice('auth.loginSuccess')
    const authError = params.get('authError')
    if (authError) {
      setRedirectError(authError)
      setModal({ mode: 'login', returnTo: '' })
    }
    if (params.has('auth') || params.has('authError')) {
      params.delete('auth')
      params.delete('authError')
      const query = params.toString()
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
    }
    fetchCurrentUser(controller.signal).then((currentUser) => {
      setUser(adaptUser(currentUser))
      setApiError('')
    }).catch((error) => {
      if (controller.signal.aborted) return
      if (error.status !== 401) setApiError(error.code || 'api_unavailable')
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [])

  const openAuthModal = useCallback((mode = 'login', returnTo = '/') => setModal({ mode, returnTo }), [])
  const closeAuthModal = useCallback(() => {
    setModal(null)
    setRedirectError('')
  }, [])

  const completeAuthentication = useCallback(async (noticeKey = 'auth.loginSuccess') => {
    const destination = modal?.returnTo
    setModal(null)
    setRedirectError('')
    setNotice(noticeKey)
    await refreshUser()
    if (destination) {
      navigate(destination)
      const anchor = destination.includes('#') ? destination.slice(destination.indexOf('#') + 1) : ''
      if (anchor) {
        window.setTimeout(() => {
          document.getElementById(decodeURIComponent(anchor))?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }, [modal, navigate, refreshUser])

  const dismissNotice = useCallback(() => setNotice(''), [])
  const register = useCallback(async (input) => {
    const nextUser = await registerWithEmail(input)
    setUser(adaptUser(nextUser))
    return nextUser
  }, [])
  const login = useCallback(async (input) => {
    const nextUser = await loginWithEmail(input)
    setUser(adaptUser(nextUser))
    return nextUser
  }, [])
  const logout = useCallback(async () => {
    await signOutUser()
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user,
    profile: user,
    profileError: apiError,
    isAdmin: user?.role === 'ADMIN' && user.email === OWNER_EMAIL,
    loading,
    configured: !apiError,
    apiError,
    modal,
    redirectError,
    notice,
    openAuthModal,
    closeAuthModal,
    completeAuthentication,
    dismissNotice,
    register,
    login,
    loginGoogle: loginWithGoogle,
    sendPasswordReset: resetPassword,
    resetPassword: changePassword,
    refreshUser,
    logout,
  }), [user, apiError, loading, modal, redirectError, notice, openAuthModal, closeAuthModal, completeAuthentication, dismissNotice, register, login, refreshUser, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
