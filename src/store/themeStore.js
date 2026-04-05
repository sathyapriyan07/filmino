import { create } from 'zustand'

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'dark',
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    set({ theme: next })
  },
  init: () => {
    const theme = localStorage.getItem('theme') || 'dark'
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
}))
