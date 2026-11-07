import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useCatalog } from './CatalogContext.jsx'

const CartContext = createContext(null)
const STORAGE_KEY = 'luna-cart'
function readStoredCart() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {}
    return Object.fromEntries(Object.entries(stored).filter(([id, quantity]) => (
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99
    )))
  } catch {
    return {}
  }
}

export function CartProvider({ children }) {
  const { menuItems } = useCatalog()
  const [cart, setCart] = useState(readStoredCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])
  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0)
  const cartTotal = menuItems.reduce((total, item) => total + item.price * (cart[item.id] ?? 0), 0)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // Storage can be disabled by the browser; cart interactions still work in memory.
    }
  }, [cart])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function showToast(key, values) {
    setToast({ id: Date.now(), key, values })
  }

  function addItem(item) {
    setCart((current) => ({ ...current, [item.id]: Math.min((current[item.id] ?? 0) + 1, 99) }))
    showToast('notifications.itemAdded', item.nameKey ? { nameKey: item.nameKey } : { name: item.names?.en || '' })
  }

  function changeQuantity(itemId, amount) {
    setCart((current) => {
      const quantity = (current[itemId] ?? 0) + amount
      if (quantity <= 0) {
        const next = { ...current }
        delete next[itemId]
        return next
      }
      return { ...current, [itemId]: Math.min(quantity, 99) }
    })
  }

  function removeItem(item) {
    setCart((current) => {
      const next = { ...current }
      delete next[item.id]
      return next
    })
    showToast('notifications.itemRemoved', { nameKey: item.nameKey })
  }

  const value = {
    cart,
    menuItems,
    cartCount,
    cartTotal,
    cartOpen,
    toast,
    addItem,
    changeQuantity,
    removeItem,
    openCart,
    closeCart,
    dismissToast: () => setToast(null),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}