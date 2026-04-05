import { useCallback } from 'react'

const KEY = 'filmino_recently_viewed'
const MAX = 20

export function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function useRecentlyViewed() {
  const add = useCallback((item) => {
    const prev = getRecentlyViewed().filter(i => !(i.id === item.id && i._type === item._type))
    localStorage.setItem(KEY, JSON.stringify([item, ...prev].slice(0, MAX)))
  }, [])

  return { add, getAll: getRecentlyViewed }
}
