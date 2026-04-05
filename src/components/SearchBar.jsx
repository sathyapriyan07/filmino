import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X, Film, Tv, User, ArrowRight, Clock } from 'lucide-react'
import { supabase } from '../services/supabase'
import { debounce, cn } from '../utils/helpers'

const RECENT_KEY = 'filmino_recent_searches'
const MAX_RECENT = 5

const getRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] } }
const saveRecent = (q) => {
  const prev = getRecent().filter(r => r !== q)
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)))
}

export default function SearchBar({ className = '', autoFocus = false }) {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState({ movies: [], series: [], persons: [] })
  const [open,      setOpen]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [recent,    setRecent]    = useState(getRecent)
  const ref      = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const allResults = [
    ...results.movies.map(m  => ({ ...m, _href: `/movie/${m.id}`,  _title: m.title, _year: m.release_date?.slice(0,4) })),
    ...results.series.map(s  => ({ ...s, _href: `/series/${s.id}`, _title: s.name,  _year: s.first_air_date?.slice(0,4) })),
    ...results.persons.map(p => ({ ...p, _href: `/person/${p.id}`, _title: p.name })),
  ]

  const search = useCallback(debounce(async (q) => {
    if (!q.trim()) { setResults({ movies: [], series: [], persons: [] }); setLoading(false); return }
    setLoading(true)
    try {
      const [mv, sv, pv] = await Promise.all([
        supabase.from('movies').select('id,title,poster,release_date,vote_average').ilike('title', `%${q}%`).limit(4),
        supabase.from('series').select('id,name,poster,first_air_date,vote_average').ilike('name', `%${q}%`).limit(4),
        supabase.from('persons').select('id,name,profile_image,known_for_department').ilike('name', `%${q}%`).limit(3),
      ])
      setResults({ movies: mv.data || [], series: sv.data || [], persons: pv.data || [] })
    } finally { setLoading(false) }
  }, 280), [])

  useEffect(() => { search(query) }, [query])
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => { if (autoFocus) inputRef.current?.focus() }, [autoFocus])

  const hasResults = allResults.length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    saveRecent(query.trim()); setRecent(getRecent())
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setOpen(false); setQuery(''); setActiveIdx(-1)
  }

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allResults.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      const item = allResults[activeIdx]
      if (item) { navigate(item._href); setOpen(false); setQuery('') }
    }
    else if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1) }
  }

  const clearQuery = () => { setQuery(''); setResults({ movies: [], series: [], persons: [] }); inputRef.current?.focus() }

  const groups = [
    { key: 'movies',  label: 'Movies', icon: Film, color: 'text-blue-400',    offset: 0 },
    { key: 'series',  label: 'Series', icon: Tv,   color: 'text-violet-400',  offset: results.movies.length },
    { key: 'persons', label: 'People', icon: User, color: 'text-emerald-400', offset: results.movies.length + results.series.length },
  ]

  return (
    <div ref={ref} className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search movies, series, people…"
            autoComplete="off"
            className={cn(
              'w-full h-10 pl-10 pr-10 rounded-xl text-sm',
              'bg-white/8 border border-white/10',
              'placeholder:text-white/30 text-white',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 focus:bg-white/12',
              'transition-all duration-250'
            )}
          />
          {query && (
            <button type="button" onClick={clearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white/60 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </form>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute top-full mt-2 w-full min-w-[300px] glass-dark rounded-2xl shadow-card-xl z-50 overflow-hidden animate-scale-in border border-white/10">

          {loading && (
            <div className="flex items-center gap-2.5 px-4 py-3.5 text-sm text-white/40">
              <div className="h-3.5 w-3.5 rounded-full border-[1.5px] border-white/15 border-t-indigo-400 animate-spin flex-shrink-0" />
              Searching…
            </div>
          )}

          {!loading && !query && recent.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-1.5">
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Recent
                </span>
                <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]) }}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
                  Clear
                </button>
              </div>
              {recent.map(r => (
                <button key={r} onClick={() => { setQuery(r); search(r) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 transition-colors text-left">
                  <Clock className="h-3.5 w-3.5 text-white/25 flex-shrink-0" />
                  <span className="text-sm text-white/70">{r}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && query && !hasResults && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-white/35">
                No results for <span className="text-white font-medium">"{query}"</span>
              </p>
            </div>
          )}

          {!loading && hasResults && (
            <div className="max-h-[400px] overflow-y-auto py-2">
              {groups.map(({ key, label, icon: Icon, color, offset }) => {
                const items = results[key]
                if (!items.length) return null
                return (
                  <div key={key} className="mb-1 last:mb-0">
                    <div className={cn('flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest', color)}>
                      <Icon className="h-3 w-3" /> {label}
                    </div>
                    {items.map((item, i) => {
                      const isMovie  = key === 'movies'
                      const isSeries = key === 'series'
                      const title = isMovie ? item.title : item.name
                      const href  = isMovie ? `/movie/${item.id}` : isSeries ? `/series/${item.id}` : `/person/${item.id}`
                      const year  = isMovie ? item.release_date?.slice(0,4) : isSeries ? item.first_air_date?.slice(0,4) : null
                      const idx   = offset + i
                      return (
                        <Link key={item.id} to={href}
                          onClick={() => { setOpen(false); setQuery(''); saveRecent(title); setRecent(getRecent()) }}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2 hover:bg-white/8 transition-colors',
                            activeIdx === idx && 'bg-white/8'
                          )}>
                          <div className="w-8 h-11 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                            {(item.poster || item.profile_image)
                              ? <img src={item.poster || item.profile_image} alt={title} className="w-full h-full object-cover" loading="lazy" />
                              : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-medium">{title?.[0]}</div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1 text-white/85">{title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {year && <span className="text-xs text-white/30">{year}</span>}
                              {item.vote_average > 0 && (
                                <span className="text-xs text-amber-400 font-medium">★ {item.vote_average.toFixed(1)}</span>
                              )}
                              {item.known_for_department && (
                                <span className="text-xs text-white/30">{item.known_for_department}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          {query && (
            <div className="border-t border-white/8">
              <Link
                to={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => { setOpen(false); saveRecent(query); setRecent(getRecent()); setQuery('') }}
                className="flex items-center justify-between px-4 py-3 text-sm text-indigo-400 hover:bg-white/5 transition-colors font-medium"
              >
                <span>See all results for "<span className="font-semibold">{query}</span>"</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
