import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Instagram,
  Menu,
  ShoppingBag,
  X,
} from 'lucide-react'
import MenuPage from './MenuPage.jsx'
import AboutPage from './AboutPage.jsx'
import GalleryPage from './GalleryPage.jsx'
import ContactPage from './ContactPage.jsx'
import { HOME_CATEGORIES } from './data/homeData.js'
import { GALLERY_ITEMS } from './data/galleryItems.js'
import { useCart } from './context/CartContext.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import Toast from './components/Toast.jsx'
import BackToTop from './components/BackToTop.jsx'
import ScrollReveal from './components/ScrollReveal.jsx'
import CafeImage from './components/CafeImage.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'
import QRMenuPage from './QRMenuPage.jsx'
import ReviewsPage, { FeaturedReviews } from './ReviewsPage.jsx'
import Profile from './pages/Profile.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import AuthModal from './components/auth/AuthModal.jsx'
import UserMenu from './components/auth/UserMenu.jsx'
import AuthNotice from './components/auth/AuthNotice.jsx'
import ThemeSwitcher from './components/ThemeSwitcher.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { useCatalog } from './context/CatalogContext.jsx'

const AdminDashboard = lazy(() => import('./AdminDashboard.jsx'))

const navLinks = [
  ['navigation.home', '/'],
  ['navigation.menu', '/menu'],
  ['navigation.about', '/about'],
  ['navigation.gallery', '/gallery'],
  ['navigation.reviews', '/reviews'],
  ['navigation.contact', '/contact'],
]

function Brand({ light = false }) {
  const { t } = useTranslation()
  return (
    <Link className={`brand${light ? ' brand--light' : ''}`} to="/" aria-label={t('navigation.home')}>
      <span className="brand__moon" aria-hidden="true">◔</span>
      <span className="brand__name">LUNA<span>CAFÉ</span></span>
    </Link>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cartCount, openCart } = useCart()
  const { user, openAuthModal } = useAuth()
  const { t } = useTranslation()

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className={`main-nav${menuOpen ? ' main-nav--open' : ''}`} aria-label={t('navigation.ariaLabel')}>
          {navLinks.map(([key, href]) => (
            <Link key={key} to={href} onClick={closeMenu}>{t(key)}</Link>
          ))}
          <div className="main-nav__actions">
            <div className="main-nav__auth">
              {user ? (
                <UserMenu />
              ) : (
                <>
                  <button className="auth-header__login" type="button" onClick={() => { openAuthModal('login'); closeMenu() }}>{t('auth.login')}</button>
                  <button className="auth-header__register" type="button" onClick={() => { openAuthModal('register'); closeMenu() }}>{t('auth.register')}</button>
                </>
              )}
            </div>
            <Link className="button button--dark nav-book" to="/contact#reservation" onClick={closeMenu}>
              {t('navigation.reservation')} <ArrowUpRight size={15} strokeWidth={1.8} />
            </Link>
          </div>
          <div className="main-nav__language"><LanguageSwitcher /></div>
        </nav>
        <div className="header-tools">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <button className="header-cart" type="button" aria-label={t('cart.open', { count: cartCount })} onClick={openCart}>
            <ShoppingBag size={18} strokeWidth={1.7} />
            <span>{cartCount}</span>
          </button>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? t('header.closeNavigation') : t('header.openNavigation')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  const { t, i18n } = useTranslation()
  const { siteContent, siteContentError } = useCatalog()
  const subtitle = siteContent['hero-subtitle']?.[i18n.resolvedLanguage]
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero__image" role="img" aria-label={t('hero.imageAlt')} />
      <div className="hero__shade" />
      <div className="hero__content">
        <p className="eyebrow eyebrow--light"><span /> {t('hero.kicker')}</p>
        <h1 id="hero-title">{t('hero.titleLineOne')}<br /><em>{t('hero.titleLineTwo')}</em></h1>
        <p className="hero__intro">{subtitle || t('hero.subtitle')}</p>
        {siteContentError && <small className="site-content-fallback" role="status">{t('adminPanel.publicContentFallback')}</small>}
        <div className="hero__actions">
          <Link className="button button--light" to="/menu">{t('hero.exploreMenu')} <ArrowRight size={16} /></Link>
          <Link className="text-link text-link--light" to="/about">{t('hero.ourStory')} <ArrowDown size={14} /></Link>
        </div>
      </div>
      <div className="hero__aside" aria-hidden="true"><span>{t('hero.sideNote')}</span><i /></div>
      <Link className="hero__scroll" to="/about" aria-label={t('hero.scrollLabel')}><ArrowDown size={16} /></Link>
      <div className="hero__index" aria-hidden="true">{t('hero.index')} <span>—</span> {t('hero.indexNote')}</div>
    </section>
  )
}

function PromotionBanner() {
  const { t, i18n } = useTranslation()
  const { banners } = useCatalog()
  const banner = banners[0]
  if (!banner) return null
  const title = banner.titles?.[i18n.resolvedLanguage] || banner.titles?.en
  const message = banner.messages?.[i18n.resolvedLanguage] || banner.messages?.en
  return (
    <aside className="promotion-banner">
      {banner.imageUrl && <img src={banner.imageUrl} alt="" />}
      <div><p className="eyebrow"><span /> LUNA CAFÉ</p><strong>{title}</strong><p>{message}</p></div>
      {banner.linkUrl && (banner.linkUrl.startsWith('/') && !banner.linkUrl.startsWith('//')
        ? <Link className="text-link" to={banner.linkUrl}>{t('adminPanel.bannerAction')} <ArrowUpRight size={14} /></Link>
        : <a className="text-link" href={banner.linkUrl}>{t('adminPanel.bannerAction')} <ArrowUpRight size={14} /></a>)}
    </aside>
  )
}

function Intro() {
  const { t } = useTranslation()
  return (
    <section className="intro section-wrap" id="about">
      <div className="intro__label">
        <p className="eyebrow"><span /> {t('homeIntro.eyebrow')}</p>
        <span className="intro__asterisk" aria-hidden="true">✳</span>
      </div>
      <div className="intro__body">
        <h2>{t('homeIntro.titleLineOne')}<br /><em>{t('homeIntro.titleLineTwo')}</em></h2>
        <div className="intro__copy">
          <p>{t('homeIntro.paragraphOne')}</p>
          <p>{t('homeIntro.paragraphTwo')}</p>
          <Link className="text-link" to="/about">{t('homeIntro.link')} <ArrowRight size={15} /></Link>
        </div>
      </div>
      <div className="intro__caption"><span>01 / 04</span><span>{t('homeIntro.caption')}</span></div>
    </section>
  )
}

function MenuSection() {
  const { t } = useTranslation()
  return (
    <section className="menu-section" id="menu">
      <div className="section-wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> {t('homeMenu.eyebrow')}</p>
            <h2>{t('homeMenu.titleLineOne')} <em>{t('homeMenu.titleLineTwo')}</em></h2>
          </div>
          <Link className="text-link section-heading__link" to="/menu">{t('homeMenu.viewAll')} <ArrowUpRight size={15} /></Link>
        </div>
        <div className="category-grid">
          {HOME_CATEGORIES.map((category) => (
            <Link className="category" to="/menu" key={category.nameKey}>
              <div className="category__image-wrap">
                <CafeImage src={category.image} alt={category.alt} />
                <span className="category__arrow"><ArrowUpRight size={18} /></span>
              </div>
              <div className="category__meta"><span>{category.number} / 03</span><span>{t(category.noteKey)}</span></div>
              <h3>{t(category.nameKey)}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function Gallery() {
  const { t } = useTranslation()
  return (
    <section className="gallery section-wrap" id="gallery">
      <div className="gallery__heading">
        <p className="eyebrow"><span /> {t('homeGallery.eyebrow')}</p>
        <h2>{t('homeGallery.titleLineOne')} <em>{t('homeGallery.titleLineTwo')}</em></h2>
      </div>
      <div className="gallery__grid">
        {GALLERY_ITEMS.slice(0, 3).map((item, index) => (
          <figure className={`gallery__item gallery__item--${index + 1}`} key={item.image}>
            <CafeImage src={item.image} alt={t(item.altKey)} />
          </figure>
        ))}
        <p className="gallery__note">{t('homeGallery.noteLineOne')}<br />{t('homeGallery.noteLineTwo')}</p>
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="site-footer">
      <div className="footer-main section-wrap">
        <div className="footer__invitation">
          <p className="eyebrow eyebrow--light"><span /> {t('footer.kicker')}</p>
          <h2>{t('footer.headlineOne')}<br /><em>{t('footer.headlineTwo')}</em></h2>
          <Link className="button button--light" to="/contact#reservation">{t('footer.bookTable')} <ArrowUpRight size={15} /></Link>
        </div>
        <div className="footer__details">
          <div className="footer__detail">
            <h3>{t('footer.findUs')}</h3>
            <p>{t('footer.address')}<br />{t('footer.city')}</p>
            <a href="https://maps.google.com/?q=18+Willow+Lane+Brooklyn+NY+11222">{t('footer.directions')} <ArrowUpRight size={13} /></a>
          </div>
          <div className="footer__detail">
            <h3>{t('footer.comeBy')}</h3>
            <p>{t('footer.weekdays')}<br />{t('footer.weekends')}</p>
            <a href="tel:+17185550184">+1 (718) 555-0184 <ArrowUpRight size={13} /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom section-wrap">
        <Brand light />
        <p>{t('footer.tagline')}</p>
        <a className="footer-social" href="https://www.instagram.com/" aria-label={t('footer.instagram')}><Instagram size={17} /></a>
        <span className="footer-copy">© {new Date().getFullYear()} LUNA CAFÉ</span>
      </div>
    </footer>
  )
}

export default function App() {
  const { i18n, t } = useTranslation()
  const location = useLocation()
  const previousLocation = useRef(location)

  useEffect(() => {
    if (location.pathname === '/admin') return
    const language = (i18n.resolvedLanguage || 'ru').split('-')[0]
    document.documentElement.lang = language
    document.title = t('meta.title')
    const description = document.querySelector('meta[name="description"]')
    if (description) description.content = t('meta.description')
  }, [i18n.resolvedLanguage, location.pathname, t])

  useLayoutEffect(() => {
    const previous = previousLocation.current
    previousLocation.current = location

    if (location.hash) {
      window.requestAnimationFrame(() => {
        document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } else if (previous.key !== location.key) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [location])

  if (location.pathname === '/qr-menu') return <><QRMenuPage /><AuthModal /><AuthNotice /></>
  if (location.pathname === '/admin') return <Suspense fallback={<main className="admin-login">{t('common.loading')}</main>}><AdminDashboard /></Suspense>

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<main><PromotionBanner /><Hero /><Intro /><MenuSection /><Gallery /><FeaturedReviews /></main>} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      <CartDrawer />
      <Toast />
      <BackToTop />
      <ScrollReveal />
      <AuthModal />
      <AuthNotice />
    </>
  )
}
