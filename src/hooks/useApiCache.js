import { useState, useEffect, useRef } from 'react'

const cache = new Map()

/**
 * useApiCache(key, fetcher)
 * Caches the result of `fetcher` by `key` for the lifetime of the page session.
 * Returns { data, loading, error }
 */
export function useApiCache(key, fetcher, deps = []) {
  const [data, setData]     = useState(() => cache.get(key) ?? null)
  const [loading, setLoading] = useState(!cache.has(key))
  const [error, setError]   = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (cache.has(key)) {
      setData(cache.get(key))
      setLoading(false)
      return
    }
    setLoading(true)
    fetcher()
      .then(result => {
        if (!mounted.current) return
        cache.set(key, result)
        setData(result)
      })
      .catch(err => { if (mounted.current) setError(err) })
      .finally(() => { if (mounted.current) setLoading(false) })
    return () => { mounted.current = false }
  }, deps)

  return { data, loading, error }
}

export function clearCache(key) {
  if (key) cache.delete(key)
  else cache.clear()
}
