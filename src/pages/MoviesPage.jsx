import { useState, useEffect, useRef } from 'react'
import { movieService } from '../services/media'
import { genreService } from '../services/admin'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { cn } from '../utils/helpers'

const LIMIT = 24

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',     label: 'Newest First' },
  { value: 'title',      label: 'A – Z' },
]

export default function MoviesPage() {
  const [movies,      setMovies]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page,        setPage]        = useState(1)
  const [total,       setTotal]       = useState(0)
  const [genres,      setGenres]      = useState([])
  const [filters,     setFilters]     = useState({ sortBy: 'popularity', genre: '', minRating: '' })
  const [showFilters, setShowFilters] = useState(false)
  const loaderRef = useRef(null)

  useEffect(() => { genreService.getAll().then(setGenres) }, [])
  useEffect(() => { setMovies([]); setPage(1); load(1, true) }, [filters])

  async function load(p = page, reset = false) {
    if (reset) setLoading(true); else setLoadingMore(true)
    try {
      const { data, count } = await movieService.getAll({ page: p, limit: LIMIT, sortBy: filters.sortBy, genre: filters.genre })
      setMovies(prev => reset ? (data || []) : [...prev, ...(data || [])])
      setTotal(count || 0)
    } finally { setLoading(false); setLoadingMore(false) }
  }

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore && movies.length < total) {
        const next = page + 1; setPage(next); load(next)
      }
    }, { threshold: 0.1 })
    if (loaderRef.current) obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [loadingMore, movies.length, total, page])

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clearFilters = () => setFilters({ sortBy: 'popularity', genre: '', minRating: '' })
  const activeCount = [filters.genre, filters.minRating].filter(Boolean).length

  return (
    <div className="bg-[#0B0B0F] min-h-screen">
      <div className="ott-container py-10 md:py-14">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight text-cinematic">Movies</h1>
            <p className="text-white/35 text-sm mt-1.5 font-medium">{total.toLocaleString()} titles</p>
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold border transition-all',
              showFilters
                ? 'bg-white text-black border-white'
                : 'bg-white/8 border-white/15 text-white hover:bg-white/12'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Sort chips (always visible) ── */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          <span className="text-xs text-white/30 font-medium flex-shrink-0 mr-1">Sort:</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter('sortBy', opt.value)}
              className={cn(
                'filter-chip flex-shrink-0',
                filters.sortBy === opt.value ? 'filter-chip-active' : 'filter-chip-inactive'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── Expanded filter panel ── */}
        {showFilters && (
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 mb-8 animate-fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Genre chips */}
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-3">Genre</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('genre', '')}
                    className={cn('filter-chip', !filters.genre ? 'filter-chip-active' : 'filter-chip-inactive')}
                  >
                    All
                  </button>
                  {genres.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setFilter('genre', filters.genre === g.name ? '' : g.name)}
                      className={cn('filter-chip', filters.genre === g.name ? 'filter-chip-active' : 'filter-chip-inactive')}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min rating chips */}
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-3">Min Rating</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('minRating', '')}
                    className={cn('filter-chip', !filters.minRating ? 'filter-chip-active' : 'filter-chip-inactive')}
                  >
                    Any
                  </button>
                  {[9, 8, 7, 6].map(r => (
                    <button
                      key={r}
                      onClick={() => setFilter('minRating', filters.minRating === String(r) ? '' : String(r))}
                      className={cn('filter-chip', filters.minRating === String(r) ? 'filter-chip-active' : 'filter-chip-inactive')}
                    >
                      ≥ {r}.0 ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active filter tags */}
            {activeCount > 0 && (
              <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/8 flex-wrap">
                {filters.genre && (
                  <span className="flex items-center gap-1.5 text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 rounded-full px-3 py-1">
                    {filters.genre}
                    <button onClick={() => setFilter('genre', '')} className="hover:text-white transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.minRating && (
                  <span className="flex items-center gap-1.5 text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-full px-3 py-1">
                    ≥ {filters.minRating}.0 ★
                    <button onClick={() => setFilter('minRating', '')} className="hover:text-white transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-xs text-white/35 hover:text-white/60 transition-colors ml-auto">
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Grid ── */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {loading
            ? Array.from({ length: LIMIT }).map((_, i) => (
                <MovieCardSkeleton key={i} width="w-full" />
              ))
            : movies.map(m => (
                <MovieCard key={m.id} item={m} type="movie" width="w-full" />
              ))
          }
        </div>

        {/* ── Infinite scroll sentinel ── */}
        <div ref={loaderRef} className="h-16 flex items-center justify-center mt-6">
          {loadingMore && (
            <div className="flex items-center gap-2.5 text-sm text-white/35">
              <div className="h-4 w-4 rounded-full border-[1.5px] border-white/10 border-t-indigo-400 animate-spin" />
              Loading more…
            </div>
          )}
          {!loading && !loadingMore && movies.length > 0 && movies.length >= total && (
            <p className="text-xs text-white/20">All {total.toLocaleString()} movies loaded</p>
          )}
        </div>
      </div>
    </div>
  )
}
