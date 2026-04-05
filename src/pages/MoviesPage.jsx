import { useState, useEffect } from 'react'
import { movieService } from '../services/media'
import MediaCard from '../components/MediaCard'
import { Skeleton, Select, Button } from '../components/ui'
import { Filter } from 'lucide-react'

export default function MoviesPage() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState('popularity')
  const LIMIT = 24

  useEffect(() => {
    load()
  }, [page, sortBy])

  async function load() {
    setLoading(true)
    try {
      const { data, count } = await movieService.getAll({ page, limit: LIMIT, sortBy })
      setMovies(data || [])
      setTotal(count || 0)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Movies</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} movies</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }} className="w-40">
            <option value="popularity">Most Popular</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
            <option value="title">A-Z</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: LIMIT }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] rounded-2xl" />
              <Skeleton className="h-4 mt-2 w-3/4" />
            </div>
          ))
          : movies.map(movie => <MediaCard key={movie.id} item={movie} type="movie" />)
        }
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
