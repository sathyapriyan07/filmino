import { useState, useEffect, useRef, useCallback } from 'react'
import { movieService } from '../services/media'
import { genreService } from '../services/admin'
import MediaCard, { MediaCardSkeleton } from '../components/MediaCard'
import { Select, Button, Badge } from '../components/ui'
import { SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react'
import { cn } from '../utils/helpers'

const LIMIT = 24

export default function MoviesPage() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [genres, setGenres] = useState([])
  const [filters, setFilters] = useState({ sortBy: 'popularity', genre: '', year: '', minRating: '' })
  const [showFilters, setShowFilters] = useState(false)
  const loaderRef = useRef(null)

  useEffect(() => { genreService.getAll().then(setGenres) }, [])

  useEffect(() => {
    setMovies([])
    setPage(1)
    load(1, true)
  }, [filters])

  async function load(p = page, reset = false) {
    if (reset) setLoading(true); else setLoadingMore(true)
    try {
      const { data, count } = await movieService.getAll({ page: p, limit: LIMIT, sortBy: filters.sortBy, genre: filters.genre })
      setMovies(prev => reset ? (data || []) : [...prev, ...(data || [])])
      setTotal(count || 0)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore && movies.length < total) {
        const next = page + 1
        setPage(next)
        load(next)
      }
    }, { threshold: 0.1 })
    if (loaderRef.current) obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [loadingMore, movies.length, total, page])

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))
  const activeFilters = [filters.genre, filters.year, filters.minRating].filter(Boolean).length
  const years = Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Movies</h1>
          <p className="text-muted-foreground text-sm mt-1">{total.toLocaleString()} movies</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilters > 0 && (
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{activeFilters}</span>
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sort by</label>
              <Select value={filters.sortBy} onChange={e => setFilter('sortBy', e.target.value)}>
                <option value="popularity">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
                <option value="title">A–Z</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Genre</label>
              <Select value={filters.genre} onChange={e => setFilter('genre', e.target.value)}>
                <option value="">All genres</option>
                {genres.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Year</label>
              <Select value={filters.year} onChange={e => setFilter('year', e.target.value)}>
                <option value="">Any year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Min Rating</label>
              <Select value={filters.minRating} onChange={e => setFilter('minRating', e.target.value)}>
                <option value="">Any rating</option>
                {[9, 8, 7, 6, 5].map(r => <option key={r} value={r}>≥ {r}.0</option>)}
              </Select>
            </div>
          </div>
          {activeFilters > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Active:</span>
              {filters.genre && <Badge variant="secondary" className="gap-1">{filters.genre} <button onClick={() => setFilter('genre', '')}><X className="h-3 w-3" /></button></Badge>}
              {filters.year && <Badge variant="secondary" className="gap-1">{filters.year} <button onClick={() => setFilter('year', '')}><X className="h-3 w-3" /></button></Badge>}
              {filters.minRating && <Badge variant="secondary" className="gap-1">≥{filters.minRating} <button onClick={() => setFilter('minRating', '')}><X className="h-3 w-3" /></button></Badge>}
              <button onClick={() => setFilters({ sortBy: 'popularity', genre: '', year: '', minRating: '' })} className="text-xs text-destructive hover:underline ml-auto">Clear all</button>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {loading
          ? Array.from({ length: LIMIT }).map((_, i) => <MediaCardSkeleton key={i} />)
          : movies.map(movie => <MediaCard key={movie.id} item={movie} type="movie" />)
        }
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="h-10 flex items-center justify-center mt-6">
        {loadingMore && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 rounded-full border-2 border-muted border-t-primary animate-spin" />
            Loading more...
          </div>
        )}
        {!loading && !loadingMore && movies.length >= total && total > 0 && (
          <p className="text-xs text-muted-foreground">All {total} movies loaded</p>
        )}
      </div>
    </div>
  )
}
