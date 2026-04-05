import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatYear(date) {
  if (!date) return ''
  return new Date(date).getFullYear()
}

export function formatRuntime(minutes) {
  if (!minutes) return 'N/A'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatMoney(amount) {
  if (!amount) return 'N/A'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(amount)
}

export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function getGenreNames(genres) {
  if (!genres) return []
  if (typeof genres === 'string') {
    try { genres = JSON.parse(genres) } catch { return [] }
  }
  return genres.map(g => g.name || g).filter(Boolean)
}

export function truncate(str, len = 150) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}
