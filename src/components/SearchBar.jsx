import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X, Film, Tv, User } from 'lucide-react'
import { supabase } from '../services/supabase'
import { debounce } from '../utils/helpers'

export default function SearchBar({ className = '' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ movies: [], series: [], persons: [] })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const search = debounce(async (q) => {
    if (!q.trim()) { setResults({ movies: [], series: [], persons: [] }); return }
    setLoading(true)
    const [movies, series, persons] = await Promise.all([
      supabase.from('movies').select('id,title,poster,release_date').ilike('title', `%${q}%`).limit(4),
      supabase.from('series').select('id,name,poster,first_air_date').ilike('name', `%${q}%`).limit(4),
      supabase.from('persons').select('id,name,profile_image').ilike('name', `%${q}%`).limit(3),
    ])
    setResults({ movies: movies.data || [], series: series.data || [], persons: persons.data || [] })
    setLoading(false)
  }, 300)

  useEffect(() => { search(query) }, [query])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasResults = results.movies.length + results.series.length + results.persons.length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search movies, series, people..."
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background/80 backdrop-blur text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults({ movies: [], series: [], persons: [] }) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {open && query && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {loading && <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>}
          {!loading && !hasResults && query && (
            <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
          )}
          {!loading && hasResults && (
            <div className="max-h-96 overflow-y-auto">
              {results.movies.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Film className="h-3 w-3" /> Movies
                  </div>
                  {results.movies.map(m => (
                    <Link key={m.id} to={`/movie/${m.id}`} onClick={() => { setOpen(false); setQuery('') }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors">
                      {m.poster && <img src={m.poster} alt={m.title} className="w-8 h-12 object-cover rounded" />}
                      <div>
                        <div className="text-sm font-medium">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.release_date?.slice(0, 4)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {results.series.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Tv className="h-3 w-3" /> Series
                  </div>
                  {results.series.map(s => (
                    <Link key={s.id} to={`/series/${s.id}`} onClick={() => { setOpen(false); setQuery('') }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors">
                      {s.poster && <img src={s.poster} alt={s.name} className="w-8 h-12 object-cover rounded" />}
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.first_air_date?.slice(0, 4)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {results.persons.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3 w-3" /> People
                  </div>
                  {results.persons.map(p => (
                    <Link key={p.id} to={`/person/${p.id}`} onClick={() => { setOpen(false); setQuery('') }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors">
                      {p.profile_image && <img src={p.profile_image} alt={p.name} className="w-8 h-8 object-cover rounded-full" />}
                      <div className="text-sm font-medium">{p.name}</div>
                    </Link>
                  ))}
                </div>
              )}
              <Link to={`/search?q=${encodeURIComponent(query)}`} onClick={() => { setOpen(false); setQuery('') }}
                className="block px-3 py-3 text-sm text-primary text-center hover:bg-accent border-t border-border">
                See all results for "{query}"
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
