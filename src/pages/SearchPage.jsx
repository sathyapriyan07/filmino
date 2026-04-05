import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard'
import { Search, Film, Tv, User, X, SlidersHorizontal } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import { cn } from '../utils/helpers'

const LIMIT = 24

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results,     setResults]     = useState({ movies: [], series: [], persons: [] })
  const [loading,     setLoading]     = useState(false)
  const [tab,         setTab]         = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filters,     setFilters]     = useState({ minRating: '', sortBy: 'popularity' })

  useEffect(() => { if (query) doSearch() }, [query, filters])

  async function doSearch() {
    setLoading(true)
    try {
      let mq = supabase.from('movies').select('id,title,poster,vote_average,release_date,genres,popularity').ilike('title', `%${query}%`)
      let sq = supabase.from('series').select('id,name,poster,vote_average,first_air_date,genres,popularity').ilike('name', `%${query}%`)

      if (filters.minRating) {
        mq = mq.gte('vote_average', parseFloat(filters.minRating))
        sq = sq.gte('vote_average', parseFloat(filters.minRating))
      }
      const order = filters.sortBy === 'rating' ? 'vote_average' : 'popularity'
      mq = mq.order(order, { ascending: false })
      sq = sq.order(order, { ascending: false })

      const [movies, series, persons] = await Promise.all([
        mq.limit(LIMIT),
        sq.limit(LIMIT),
        supabase.from('persons').select('id,name,profile_image,known_for_department').ilike('name', `%${query}%`).limit(12),
      ])
      setResults({ movies: movies.data || [], series: series.data || [], persons: persons.data || [] })
    } finally { setLoading(false) }
  }

  const total = results.movies.length + results.series.length + results.persons.length
  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clearFilters = () => setFilters({ minRating: '', sortBy: 'popularity' })
  const activeFilters = [filters.minRating].filter(Boolean).length

  const tabs = [
    { id: 'all',    label: 'All',    count: total,                  icon: null },
    { id: 'movies', label: 'Movies', count: results.movies.length,  icon: Film },
    { id: 'series', label: 'Series', count: results.series.length,  icon: Tv },
    { id: 'people', label: 'People', count: results.persons.length, icon: User },
  ]

  return (
    <div className="bg-[#0B0B0F] min-h-screen">
      <div className="ott-container py-10 md:py-14">

        {/* Mobile search bar */}
        <div className="md:hidden mb-6">
          <SearchBar autoFocus />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight text-cinematic">
              {query
                ? <>Results for "<span className="text-indigo-400">{query}</span>"</>
                : 'Search'
              }
            </h1>
            {!loading && query && (
              <p className="text-white/35 text-sm mt-1.5 font-medium">{total} result{total !== 1 ? 's' : ''} found</p>
            )}
          </div>
          {query && (
            <button
              onClick={() => setShowFilters(v => !v)}
              className={cn(
                'flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold border transition-all flex-shrink-0',
                showFilters ? 'bg-white text-black border-white' : 'bg-white/8 border-white/15 text-white hover:bg-white/12'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilters > 0 && (
                <span className="h-5 w-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>
              )}
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 mb-6 animate-fade-up">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-3">Sort by</p>
                <div className="flex gap-2">
                  {[['popularity', 'Most Popular'], ['rating', 'Top Rated']].map(([v, l]) => (
                    <button key={v} onClick={() => setFilter('sortBy', v)}
                      className={cn('filter-chip', filters.sortBy === v ? 'filter-chip-active' : 'filter-chip-inactive')}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-3">Min Rating</p>
                <div className="flex gap-2">
                  <button onClick={() => setFilter('minRating', '')} className={cn('filter-chip', !filters.minRating ? 'filter-chip-active' : 'filter-chip-inactive')}>Any</button>
                  {[9, 8, 7].map(r => (
                    <button key={r} onClick={() => setFilter('minRating', filters.minRating === String(r) ? '' : String(r))}
                      className={cn('filter-chip', filters.minRating === String(r) ? 'filter-chip-active' : 'filter-chip-inactive')}>
                      ≥ {r}.0 ★
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="text-xs text-white/35 hover:text-white/60 transition-colors mt-4 block">Clear filters</button>
            )}
          </div>
        )}

        {/* Tabs */}
        {query && (
          <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1">
            {tabs.map(({ id, label, count, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold border transition-all whitespace-nowrap flex-shrink-0',
                  tab === id
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 border-white/10 text-white/55 hover:bg-white/10 hover:text-white'
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
                {count > 0 && (
                  <span className={cn('text-[11px] px-1.5 py-0.5 rounded-full font-bold', tab === id ? 'bg-black/15' : 'bg-white/10')}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {!query ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
              <Search className="h-9 w-9 text-white/20" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Search for anything</h2>
            <p className="text-white/35 text-sm">Find movies, series, and people</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} width="w-full" />)}
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in">
            {/* Movies */}
            {(tab === 'all' || tab === 'movies') && results.movies.length > 0 && (
              <section>
                {tab === 'all' && (
                  <div className="flex items-center gap-2 mb-4">
                    <Film className="h-4 w-4 text-white/30" />
                    <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Movies</h2>
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                  {results.movies.map(m => <MovieCard key={m.id} item={m} type="movie" width="w-full" />)}
                </div>
              </section>
            )}

            {/* Series */}
            {(tab === 'all' || tab === 'series') && results.series.length > 0 && (
              <section>
                {tab === 'all' && (
                  <div className="flex items-center gap-2 mb-4">
                    <Tv className="h-4 w-4 text-white/30" />
                    <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Series</h2>
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                  {results.series.map(s => <MovieCard key={s.id} item={s} type="series" width="w-full" />)}
                </div>
              </section>
            )}

            {/* People */}
            {(tab === 'all' || tab === 'people') && results.persons.length > 0 && (
              <section>
                {tab === 'all' && (
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-white/30" />
                    <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">People</h2>
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                  {results.persons.map(p => (
                    <Link key={p.id} to={`/person/${p.id}`} className="group block">
                      <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 mb-2 transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-[0_8px_32px_rgba(99,102,241,0.3)]">
                        {p.profile_image
                          ? <img src={p.profile_image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/20">{p.name?.[0]}</div>
                        }
                      </div>
                      <p className="text-[12px] font-semibold text-white/80 line-clamp-1 group-hover:text-indigo-400 transition-colors">{p.name}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{p.known_for_department}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* No results */}
            {total === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-white/20" />
                </div>
                <p className="text-lg font-bold text-white mb-1.5">No results found</p>
                <p className="text-white/35 text-sm">Try different keywords or adjust your filters</p>
                {activeFilters > 0 && (
                  <button onClick={clearFilters}
                    className="mt-5 h-9 px-5 rounded-full bg-white/8 border border-white/15 text-white text-sm font-medium hover:bg-white/12 transition-all">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
