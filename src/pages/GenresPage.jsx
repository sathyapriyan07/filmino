import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { genreService } from '../services/admin'
import { supabase } from '../services/supabase'
import { Skeleton, PageContainer, MediaGrid } from '../components/ui'
import { cn } from '../utils/helpers'

const GENRE_COLORS = [
  'from-blue-600 to-blue-800', 'from-purple-600 to-purple-800', 'from-red-600 to-red-800',
  'from-green-600 to-green-800', 'from-yellow-500 to-orange-600', 'from-pink-600 to-rose-700',
  'from-indigo-600 to-violet-700', 'from-teal-600 to-cyan-700', 'from-orange-500 to-red-600',
  'from-emerald-600 to-teal-700', 'from-sky-600 to-blue-700', 'from-fuchsia-600 to-purple-700',
]

function GenreCard({ genre, index }) {
  const [backdrop, setBackdrop] = useState(null)

  useEffect(() => {
    if (!genre.backdrop_media_id) return
    const table = genre.backdrop_media_type === 'movie' ? 'movies' : 'series'
    supabase.from(table).select('backdrop').eq('id', genre.backdrop_media_id).single()
      .then(({ data }) => setBackdrop(data?.backdrop))
  }, [genre.backdrop_media_id])

  const gradient = GENRE_COLORS[index % GENRE_COLORS.length]

  return (
    <Link to={`/genre/${genre.id}`} className="group relative h-28 sm:h-32 rounded-2xl overflow-hidden block">
      {backdrop ? (
        <img src={backdrop} alt={genre.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      ) : (
        <div className={cn('w-full h-full bg-gradient-to-br', gradient)} />
      )}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-base sm:text-lg text-center px-3 drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
          {genre.name}
        </span>
      </div>
      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
    </Link>
  )
}

export default function GenresPage() {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    genreService.getAll().then(data => { setGenres(data || []); setLoading(false) })
  }, [])

  return (
    <PageContainer className="py-8 md:py-10">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Browse by Genre</h1>
        <p className="text-muted-foreground text-sm mt-1.5">Discover movies and series by category</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {loading
          ? Array.from({ length: 15 }).map((_, i) => <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />)
          : genres.map((genre, i) => <GenreCard key={genre.id} genre={genre} index={i} />)
        }
      </div>

      {!loading && genres.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p>No genres yet. Import some movies to auto-create genres.</p>
        </div>
      )}
    </PageContainer>
  )
}
