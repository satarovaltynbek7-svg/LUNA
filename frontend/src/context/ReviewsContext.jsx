import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createReview, fetchApprovedReviews, fetchFeaturedReviews } from '../services/reviewService.js'

const ReviewsContext = createContext(null)

export function ReviewsProvider({ children }) {
  const [reviews, setReviews] = useState([])
  const [featuredReviews, setFeaturedReviews] = useState([])
  const [summary, setSummary] = useState({ total: 0, average: 0, distribution: {} })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadRequestId = useRef(0)

  const loadPage = useCallback(async ({ page = 1, rating, sort = 'newest', append = false, signal } = {}) => {
    const requestId = ++loadRequestId.current
    setLoading(true)
    try {
      const approved = await fetchApprovedReviews({ page, limit: 20, rating, sort, signal })
      if (requestId === loadRequestId.current) {
        setReviews((current) => append ? [...current, ...approved.reviews] : approved.reviews)
        setSummary(approved.summary)
        setPagination(approved.pagination)
        setError('')
      }
    } catch (requestError) {
      if (!signal?.aborted && requestId === loadRequestId.current) setError(requestError.code || 'api_unavailable')
    } finally {
      if (!signal?.aborted && requestId === loadRequestId.current) setLoading(false)
    }
  }, [])

  const refreshReviews = useCallback(async () => {
    const [approved, featured] = await Promise.all([
      fetchApprovedReviews({ limit: 20 }),
      fetchFeaturedReviews({ limit: 3 }),
    ])
    setReviews(approved.reviews)
    setSummary(approved.summary)
    setPagination(approved.pagination)
    setFeaturedReviews(featured.reviews)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const requestId = ++loadRequestId.current
    setLoading(true)
    Promise.all([
      fetchApprovedReviews({ limit: 20, signal: controller.signal }),
      fetchFeaturedReviews({ limit: 3, signal: controller.signal }),
    ]).then(([approved, featured]) => {
      if (requestId === loadRequestId.current) {
        setReviews(approved.reviews)
        setSummary(approved.summary)
        setPagination(approved.pagination)
        setFeaturedReviews(featured.reviews)
        setError('')
      }
    }).catch((requestError) => {
      if (!controller.signal.aborted && requestId === loadRequestId.current) setError(requestError.code || 'api_unavailable')
    }).finally(() => {
      if (!controller.signal.aborted && requestId === loadRequestId.current) setLoading(false)
    })
    return () => controller.abort()
  }, [])

  const addReview = useCallback(async ({ rating, text }) => createReview({ rating, text }), [])
  const value = useMemo(() => ({
    reviews,
    featuredReviews,
    summary,
    pagination,
    loading,
    error,
    configured: error !== 'api_unavailable',
    addReview,
    refreshReviews,
    loadPage,
  }), [reviews, featuredReviews, summary, pagination, loading, error, addReview, refreshReviews, loadPage])

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
}

export function useReviews() {
  const context = useContext(ReviewsContext)
  if (!context) throw new Error('useReviews must be used within ReviewsProvider')
  return context
}
