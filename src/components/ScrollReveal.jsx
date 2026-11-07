import { useEffect } from 'react'

export default function ScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll('main > section, main > .section-wrap')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('scroll-reveal', 'is-revealed'))
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })

    targets.forEach((target) => {
      target.classList.add('scroll-reveal')
      observer.observe(target)
    })
    return () => observer.disconnect()
  }, [])

  return null
}