import { useEffect } from 'react'
import { useLocation } from 'react-router'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const MEASUREMENT_ID = 'G-86KZ5ZWB79'

// Sends a GA4 page_view on every client-side route change.
// index.html loads gtag with send_page_view disabled so this is the single source.
export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window.gtag !== 'function') return
    window.gtag('event', 'page_view', {
      send_to: MEASUREMENT_ID,
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [location])
}
