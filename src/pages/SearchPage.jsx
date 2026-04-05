import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import MediaCard from '../components/MediaCard'
import { Skeleton, Select, Button, Badge, PageContainer, MediaGrid } from '../components/ui'
import { Search, SlidersHorizontal, X, Film, Tv, User } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import { cn } from '../utils/helpers'

const LIMIT = 24

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState({ movies: [], series: [], persons: [] })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ genre: '', year: '', minRating: '', sortBy: 'popularity' })

  useEffect(() => {
    if (query) doSearch()
  }, [query, filters])

  async function doSearch() {
    setLoading(true)
    try {
      let mq = supabase.from('movies').select('id,title,poster,vote_average,release_date,genres,popularity').ilike('title', `%${query}%`)
      let sq = supabase.from('series').select('id,name,poster,vote_average,first_air_date,genres,popularity').ilike('name', `%${query}%`)

      if (filters.minRating) {
        mq = mq.gte('vote_average', parseFloat(filters.minRating))
        sq = sq.gte('vote_average', parseFloat(filters.minRating))
      }
      if (filters.year) {
        mq = mq.gte('release_date', `${filters.year}-01-01`).lte('release_date', `${filters.year}-12-31`)
        sq = sq.gte('first_air_date', `${filters.year}-01-01`).lte('first_air_date', `${filters.year}-12-31`)
      }
      if (filters.sortBy === 'rating') { mq = mq.order('vote_average', { ascending: false }); sq = sq.order('vote_average', { ascending: false }) }
      else if (filters.sortBy === 'newest') { mq = mq.order('release_date', { ascending: false }); sq = sq.order('first_air_date', { ascending: false }) }
      else { mq = mq.order('popularity', { ascending: false }); sq = sq.order('popularity', { ascending: false }) }

      const [movies, series, persons] = await Promise.all([
        mq.limit(LIMIT),
        sq.limit(LIMIT),
        supabase.from('persons').select('id,name,profile_image,known_for_department').ilike('name', `%${query}%`).limit(12),
      ])
      setResults({ movies: movies.data || [], series: series.data || [], persons: persons.data || [] })
    } finally {
      setLoading(false)
    }
  }

  const total = results.movies.length + results.series.length + results.persons.length
  const activeFilters = Object.values(filters).filter((v, i) => i < 3 && v).length

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))
  const clearFilters = () => setFilters({ genre: '', year: '', minRating: '', sortBy: 'popularity' })

  const tabs = [
    { id: 'all', label: 'All', count: total },
    { id: 'movies', label: 'Movies', count: results.movies.length, icon: Film },
    { id: 'series', label: 'Series', count: results.series.length, icon: Tv },
    { id: 'people', label: 'People', count: results.persons.length, icon: User },
  ]

  const years = Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i)

  return (
    <PageContainer className="py-8 md:py-10">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="md:hidden mb-4">
          <SearchBar autoFocus />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {query ? <>Results for "<span className="text-primary">{query}</span>"</> : 'Search'}
            </h1>
            {!loading && query && (
              <p className="text-muted-foreground text-sm mt-1">{total} result{total !== 1 ? 's' : ''} found</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2 flex-shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sort by</label>
              <Select value={filters.sortBy} onChange={e => setFilter('sortBy', e.target.value)}>
                <option value="popularity">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </Select>
            </div>
            <div className="flex items-end">
              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground w-full">
                  <X className="h-3.5 w-3.5" /> Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map(({ id, label, count, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
              tab === id ? 'bg-primary text-primary-foreground shadow-glow-sm' : 'bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground'
            )}>
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
            {count > 0 && (
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-semibold', tab === id ? 'bg-white/20' : 'bg-muted')}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      {!query ? (
        <div className="text-center py-24">
          <Search className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Search for anything</h2>
          <p className="text-muted-foreground">Find movies, series, and people</p>
        </div>
      ) : loading ? (
        <MediaGrid>
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />)}
        </MediaGrid>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {(tab === 'all' || tab === 'movies') && results.movies.length > 0 && (
            <section>
              {tab === 'all' && <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-muted-foreground"><Film className="h-4 w-4" /> Movies</h2>}
              <MediaGrid>
                {results.movies.map(m => <MediaCard key={m.id} item={m} type="movie" />)}
              </MediaGrid>
            </section>
          )}
          {(tab === 'all' || tab === 'series') && results.series.length > 0 && (
            <section>
              {tab === 'all' && <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-muted-foreground"><Tv className="h-4 w-4" /> Series</h2>}
              <MediaGrid>
                {results.series.map(s => <MediaCard key={s.id} item={s} type="series" />)}
              </MediaGrid>
            </section>
          )}
          {(tab === 'all' || tab === 'people') && results.persons.length > 0 && (
            <section>
              {tab === 'all' && <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> People</h2>}
              <MediaGrid>
                {results.persons.map(p => (
                  <Link key={p.id} to={`/person/${p.id}`} className="group text-center">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-2 shadow-card group-hover:shadow-card-hover transition-all duration-300 group-hover:scale-[1.04]">
                      {p.profile_image
                        ? <img src={p.profile_image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">{p.name?.[0]}</div>
                      }
                    </div>
                    <div className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.known_for_department}</div>
                  </Link>
                ))}
              </MediaGrid>
            </section>
          )}
          {total === 0 && (
            <div className="text-center py-20">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-semibold mb-1">No results found</p>
              <p className="text-muted-foreground text-sm">Try different keywords or adjust your filters</p>
              {activeFilters > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">Clear filters</Button>
              )}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  )
}
