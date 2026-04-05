import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { genreService } from '../services/admin'
import { supabase } from '../services/supabase'
import { Skeleton } from '../components/ui'

export default function GenresPage() {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await genreService.getAll()
        // Load backdrop images for genres
        const enriched = await Promise.all(data.map(async (genre) => {
          if (genre.backdrop_media_id && genre.backdrop_media_type) {
            const table = genre.backdrop_media_type === 'movie' ? 'movies' : 'series'
            const field = genre.backdrop_media_type === 'movie' ? 'backdrop' : 'backdrop'
            const { data: media } = await supabase.from(table).select(field).eq('id', genre.backdrop_media_id).single()
            return { ...genre, backdrop: media?.backdrop }
          }
          return genre
        }))
        setGenres(enriched)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse by Genre</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 15 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : genres.map(genre => (
            <Link
              key={genre.id}
              to={`/genre/${genre.id}`}
              className="group relative h-32 rounded-2xl overflow-hidden"
            >
              {genre.backdrop ? (
                <img src={genre.backdrop} alt={genre.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
              )}
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg text-center px-2">{genre.name}</span>
              </div>
            </Link>
          ))
        }
      </div>
    </div>
  )
}
