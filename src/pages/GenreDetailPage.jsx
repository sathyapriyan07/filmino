import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { movieService, seriesService } from '../services/media'
import MediaCard from '../components/MediaCard'
import { Skeleton, Button, Select } from '../components/ui'

export default function GenreDetailPage() {
  const { id } = useParams()
  const [genre, setGenre] = useState(null)
  const [movies, setMovies] = useState([])
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [sortBy, setSortBy] = useState('popularity')

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
    } finally {
      setLoading(false)
    }
  }

  const displayMovies = tab === 'series' ? [] : movies
  const displaySeries = tab === 'movies' ? [] : series

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{genre?.name || 'Genre'}</h1>
          <p className="text-muted-foreground text-sm mt-1">{movies.length + series.length} titles</p>
        </div>
        <Select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-40">
          <option value="popularity">Most Popular</option>
          <option value="rating">Top Rated</option>
          <option value="newest">Newest</option>
        </Select>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'movies', 'series'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {Array.from({ length: 18 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />)}
        </div>
      ) : (
        <>
          {displayMovies.length > 0 && (
            <div className="mb-8">
              {tab === 'all' && <h2 className="text-lg font-semibold mb-4">Movies</h2>}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {displayMovies.map(m => <MediaCard key={m.id} item={m} type="movie" />)}
              </div>
            </div>
          )}
          {displaySeries.length > 0 && (
            <div>
              {tab === 'all' && <h2 className="text-lg font-semibold mb-4">Series</h2>}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {displaySeries.map(s => <MediaCard key={s.id} item={s} type="series" />)}
              </div>
            </div>
          )}
          {displayMovies.length === 0 && displaySeries.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">No content found for this genre</div>
          )}
        </>
      )}
    </div>
  )
}
