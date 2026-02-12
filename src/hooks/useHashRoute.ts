import { useEffect, useState } from 'react'

export type Route = { view: 'library' } | { view: 'reader'; id: string }

export function parseHash(hash: string): Route {
  const m = hash.match(/^#\/book\/([^/?#]+)/)
  if (m) return { view: 'reader', id: decodeURIComponent(m[1]) }
  return { view: 'library' }
}

export function navigate(to: string): void {
  window.location.hash = to
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
