import React from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import i18n from './i18n/i18n.js'
import { ReviewsProvider } from './context/ReviewsContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CatalogProvider } from './context/CatalogContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { BrowserRouter } from 'react-router-dom'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <CatalogProvider>
              <CartProvider>
                <ReviewsProvider>
                  <App />
                </ReviewsProvider>
              </CartProvider>
            </CatalogProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </I18nextProvider>
  </React.StrictMode>,
)
