import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X, Film, Tv, User, ArrowRight, Clock, TrendingUp } from 'lucide-react'
import { supabase } from '../services/supabase'
import { debounce } from '../utils/helpers'
import { cn } from '../utils/helpers'

const RECENT_KEY = 'filmino_recent_searches'
const MAX_RECENT = 5

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function saveRecent(q) {
  const prev = getRecent().filter(r => r !== q)
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)))
}

export default function SearchBar({ className = '', autoFocus = false }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ movies: [], series: [], persons: [] })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [recent, setRecent] = useState(getRecent)
  const ref = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const allResults = [
    ...results.movies.map(m => ({ ...m, _type: 'movie', _title: m.title, _href: `/movie/${m.id}`, _year: m.release_date?.slice(0, 4) })),
    ...results.series.map(s => ({ ...s, _type: 'series', _title: s.name, _href: `/series/${s.id}`, _year: s.first_air_date?.slice(0, 4) })),
    ...results.persons.map(p => ({ ...p, _type: 'person', _title: p.name, _href: `/person/${p.id}` })),
  ]

  const search = useCallback(
    debounce(async (q) => {
      if (!q.trim()) { setResults({ movies: [], series: [], persons: [] }); setLoading(false); return }
      setLoading(true)
      try {
        const [movies, series, persons] = await Promise.all([
          supabase.from('movies').select('id,title,poster,release_date,vote_average').ilike('title', `%${q}%`).limit(4),
          supabase.from('series').select('id,name,poster,first_air_date,vote_average').ilike('name', `%${q}%`).limit(4),
          supabase.from('persons').select('id,name,profile_image,known_for_department').ilike('name', `%${q}%`).limit(3),
        ])
        setResults({ movies: movies.data || [], series: series.data || [], persons: persons.data || [] })
      } finally {
        setLoading(false)
      }
    }, 280),
    []
  )

  useEffect(() => { search(query) }, [query])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { if (autoFocus) inputRef.current?.focus() }, [autoFocus])

  const hasResults = allResults.length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    saveRecent(query.trim())
    setRecent(getRecent())
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
    setQuery('')
    setActiveIdx(-1)
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

  const typeIcon = { movie: <Film className="h-3.5 w-3.5" />, series: <Tv className="h-3.5 w-3.5" />, person: <User className="h-3.5 w-3.5" /> }
  const typeColor = { movie: 'text-blue-400', series: 'text-purple-400', person: 'text-green-400' }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search movies, series, people..."
            className="w-full h-10 pl-10 pr-10 rounded-xl border border-border bg-secondary/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-background focus:border-primary/30 transition-all"
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={clearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {open && (
        <div className="absolute top-full mt-2 w-full min-w-[320px] bg-card border border-border rounded-2xl shadow-card-hover z-50 overflow-hidden animate-scale-in">
          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-muted border-t-primary animate-spin" />
              Searching...
            </div>
          )}

          {/* No query — show recent */}
          {!loading && !query && recent.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Recent
                </span>
                <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]) }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
              </div>
              {recent.map(r => (
                <button key={r} onClick={() => { setQuery(r); search(r) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && query && !hasResults && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for "<span className="text-foreground font-medium">{query}</span>"
            </div>
          )}

          {/* Results */}
          {!loading && hasResults && (
            <div className="max-h-[420px] overflow-y-auto">
              {[
                { key: 'movies', label: 'Movies', icon: <Film className="h-3 w-3" />, color: 'text-blue-400' },
                { key: 'series', label: 'Series', icon: <Tv className="h-3 w-3" />, color: 'text-purple-400' },
                { key: 'persons', label: 'People', icon: <User className="h-3 w-3" />, color: 'text-green-400' },
              ].map(({ key, label, icon, color }) => {
                const items = results[key]
                if (!items.length) return null
                return (
                  <div key={key}>
                    <div className={cn('px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5', color)}>
                      {icon} {label}
                    </div>
                    {items.map((item, i) => {
                      const isMovie = key === 'movies'
                      const isSeries = key === 'series'
                      const title = isMovie ? item.title : isSeries ? item.name : item.name
                      const href = isMovie ? `/movie/${item.id}` : isSeries ? `/series/${item.id}` : `/person/${item.id}`
                      const year = isMovie ? item.release_date?.slice(0, 4) : isSeries ? item.first_air_date?.slice(0, 4) : null
                      const globalIdx = (key === 'movies' ? 0 : key === 'series' ? results.movies.length : results.movies.length + results.series.length) + i
                      return (
                        <Link key={item.id} to={href}
                          onClick={() => { setOpen(false); setQuery(''); saveRecent(title); setRecent(getRecent()) }}
                          className={cn('flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors', activeIdx === globalIdx && 'bg-accent')}>
                          <div className="w-8 h-11 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {(item.poster || item.profile_image)
                              ? <img src={item.poster || item.profile_image} alt={title} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">{title?.[0]}</div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium line-clamp-1">{title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              {year && <span>{year}</span>}
                              {item.vote_average > 0 && <span className="text-yellow-500">★ {item.vote_average?.toFixed(1)}</span>}
                              {item.known_for_department && <span>{item.known_for_department}</span>}
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

          {/* Footer */}
          {query && (
            <div className="border-t border-border">
              <Link to={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => { setOpen(false); saveRecent(query); setRecent(getRecent()); setQuery('') }}
                className="flex items-center justify-between px-4 py-3 text-sm text-primary hover:bg-accent transition-colors font-medium">
                <span>See all results for "<span className="font-semibold">{query}</span>"</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
