import { useState, useEffect, useRef } from 'react'
import { seriesService } from '../services/media'
import { genreService } from '../services/admin'
import MediaCard, { MediaCardSkeleton } from '../components/MediaCard'
import { Select, Button, Badge, PageContainer, MediaGrid } from '../components/ui'
import { SlidersHorizontal, X } from 'lucide-react'

const LIMIT = 24

export default function SeriesPage() {
  const [series,      setSeries]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page,        setPage]        = useState(1)
  const [total,       setTotal]       = useState(0)
  const [genres,      setGenres]      = useState([])
  const [filters,     setFilters]     = useState({ sortBy: 'popularity', genre: '', year: '', minRating: '' })
  const [showFilters, setShowFilters] = useState(false)
  const loaderRef = useRef(null)

  useEffect(() => { genreService.getAll().then(setGenres) }, [])
  useEffect(() => { setSeries([]); setPage(1); load(1, true) }, [filters])

  async function load(p = page, reset = false) {
    if (reset) setLoading(true); else setLoadingMore(true)
    try {
      const { data, count } = await seriesService.getAll({ page: p, limit: LIMIT, sortBy: filters.sortBy, genre: filters.genre })
      setSeries(prev => reset ? (data || []) : [...prev, ...(data || [])])
      setTotal(count || 0)
    } finally { setLoading(false); setLoadingMore(false) }
  }

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore && series.length < total) {
        const next = page + 1; setPage(next); load(next)
      }
    }, { threshold: 0.1 })
    if (loaderRef.current) obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [loadingMore, series.length, total, page])

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clearFilters = () => setFilters({ sortBy: 'popularity', genre: '', year: '', minRating: '' })
  const activeCount = [filters.genre, filters.year, filters.minRating].filter(Boolean).length
  const years = Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i)

  return (
    <PageContainer className="py-10 md:py-12">
      <div className="flex items-end justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Series</h1>
          <p className="text-muted-foreground text-sm mt-1.5">{total.toLocaleString()} titles</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)} className="gap-2 mb-0.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{activeCount}</span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-card border border-border/60 rounded-2xl p-5 mb-8 animate-fade-up shadow-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Sort by', key: 'sortBy',    opts: [['popularity','Most Popular'],['rating','Top Rated'],['newest','Newest'],['title','A–Z']] },
              { label: 'Genre',   key: 'genre',     opts: [['','All genres'], ...genres.map(g => [g.name, g.name])] },
              { label: 'Year',    key: 'year',      opts: [['','Any year'],   ...years.map(y => [y, y])] },
              { label: 'Rating',  key: 'minRating', opts: [['','Any rating'], ...[9,8,7,6,5].map(r => [r, `≥ ${r}.0`])] },
            ].map(({ label, key, opts }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                <Select value={filters[key]} onChange={e => setFilter(key, e.target.value)}>
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </div>
            ))}
          </div>
          {activeCount > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 flex-wrap">
              {filters.genre     && <Badge variant="secondary" className="gap-1.5">{filters.genre}     <button onClick={() => setFilter('genre','')}><X className="h-3 w-3" /></button></Badge>}
              {filters.year      && <Badge variant="secondary" className="gap-1.5">{filters.year}      <button onClick={() => setFilter('year','')}><X className="h-3 w-3" /></button></Badge>}
              {filters.minRating && <Badge variant="secondary" className="gap-1.5">≥{filters.minRating}<button onClick={() => setFilter('minRating','')}><X className="h-3 w-3" /></button></Badge>}
              <button onClick={clearFilters} className="text-xs text-destructive hover:underline ml-auto">Clear all</button>
            </div>
          )}
        </div>
      )}

      <MediaGrid>
        {loading
          ? Array.from({ length: LIMIT }).map((_, i) => <MediaCardSkeleton key={i} />)
          : series.map(s => <MediaCard key={s.id} item={s} type="series" />)
        }
      </MediaGrid>

      <div ref={loaderRef} className="h-16 flex items-center justify-center mt-4">
        {loadingMore && (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="h-4 w-4 rounded-full border-[1.5px] border-muted-foreground/20 border-t-primary animate-spin" />
            Loading more…
          </div>
        )}
        {!loading && !loadingMore && series.length > 0 && series.length >= total && (
          <p className="text-xs text-muted-foreground/60">All {total.toLocaleString()} series loaded</p>
        )}
      </div>
    </PageContainer>
  )
}
