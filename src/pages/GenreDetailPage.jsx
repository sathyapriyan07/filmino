import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { movieService, seriesService } from '../services/media'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard'
import { cn } from '../utils/helpers'

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popular' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',     label: 'Newest' },
]

export default function GenreDetailPage() {
  const { id } = useParams()
  const [genre,   setGenre]   = useState(null)
  const [movies,  setMovies]  = useState([])
  const [series,  setSeries]  = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('all')
  const [sortBy,  setSortBy]  = useState('popularity')

  useEffect(() => { load() }, [id, sortBy])

  async function load() {
    setLoading(true)
    try {
      const { data: genreData } = await supabase.from('genres').select('*').eq('id', id).single()
      setGenre(genreData)
      const [moviesData, seriesData] = await Promise.all([
        movieService.getAll({ limit: 50, genre: genreData?.name, sortBy }),
        seriesService.getAll({ limit: 50, genre: genreData?.name, sortBy }),
      ])
      setMovies(moviesData.data || [])
      setSeries(seriesData.data || [])
    } finally { setLoading(false) }
  }

  const displayMovies = tab === 'series' ? [] : movies
  const displaySeries = tab === 'movies' ? [] : series
  const total = movies.length + series.length

  return (
    <div className="bg-[#0B0B0F] min-h-screen">
      <div className="ott-container py-10 md:py-14">

        {/* Header */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight text-cinematic">
            {genre?.name || 'Genre'}
          </h1>
          <p className="text-white/35 text-sm mt-1.5 font-medium">{total} titles</p>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          {/* Type tabs */}
          <div className="flex gap-2">
            {[['all', 'All'], ['movies', 'Movies'], ['series', 'Series']].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)}
                className={cn('filter-chip', tab === v ? 'filter-chip-active' : 'filter-chip-inactive')}>
                {l}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />

          {/* Sort chips */}
          <div className="flex gap-2">
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setSortBy(opt.value)}
                className={cn('filter-chip', sortBy === opt.value ? 'filter-chip-active' : 'filter-chip-inactive')}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 18 }).map((_, i) => <MovieCardSkeleton key={i} width="w-full" />)}
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in">
            {displayMovies.length > 0 && (
              <div>
                {tab === 'all' && (
                  <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-4">Movies</p>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                  {displayMovies.map(m => <MovieCard key={m.id} item={m} type="movie" width="w-full" />)}
                </div>
              </div>
            )}
            {displaySeries.length > 0 && (
              <div>
                {tab === 'all' && (
                  <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-4">Series</p>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                  {displaySeries.map(s => <MovieCard key={s.id} item={s} type="series" width="w-full" />)}
                </div>
              </div>
            )}
            {displayMovies.length === 0 && displaySeries.length === 0 && (
              <div className="text-center py-24">
                <p className="text-white/25 text-sm">No content found for this genre</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
