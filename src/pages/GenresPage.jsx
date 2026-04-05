import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { genreService } from '../services/admin'
import { supabase } from '../services/supabase'
import { Skeleton } from '../components/ui'
import { cn } from '../utils/helpers'

const PALETTE = [
  { from: '#6366f1', to: '#8b5cf6' }, // indigo → violet
  { from: '#ec4899', to: '#f43f5e' }, // pink → rose
  { from: '#f59e0b', to: '#ef4444' }, // amber → red
  { from: '#10b981', to: '#06b6d4' }, // emerald → cyan
  { from: '#3b82f6', to: '#6366f1' }, // blue → indigo
  { from: '#8b5cf6', to: '#ec4899' }, // violet → pink
  { from: '#f97316', to: '#f59e0b' }, // orange → amber
  { from: '#06b6d4', to: '#3b82f6' }, // cyan → blue
  { from: '#84cc16', to: '#10b981' }, // lime → emerald
  { from: '#f43f5e', to: '#f97316' }, // rose → orange
  { from: '#a855f7', to: '#6366f1' }, // purple → indigo
  { from: '#14b8a6', to: '#84cc16' }, // teal → lime
]

function GenreCard({ genre, index }) {
  const [backdrop, setBackdrop] = useState(null)
  const palette = PALETTE[index % PALETTE.length]

  useEffect(() => {
    if (!genre.backdrop_media_id) return
    const table = genre.backdrop_media_type === 'movie' ? 'movies' : 'series'
    supabase.from(table).select('backdrop').eq('id', genre.backdrop_media_id).single()
      .then(({ data }) => setBackdrop(data?.backdrop))
  }, [genre.backdrop_media_id])

  return (
    <Link
      to={`/genre/${genre.id}`}
      className="group relative h-32 sm:h-36 md:h-40 rounded-2xl overflow-hidden block"
    >
      {/* Background */}
      {backdrop ? (
        <img
          src={backdrop}
          alt={genre.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div
          className="w-full h-full"
          style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
        />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-300" />
      {/* Bottom fade for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Shine sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/8 to-transparent" />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-base sm:text-lg text-center px-4 drop-shadow-lg tracking-tight group-hover:scale-105 transition-transform duration-300">
          {genre.name}
        </span>
      </div>
    </Link>
  )
}

export default function GenresPage() {
  const [genres,  setGenres]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    genreService.getAll().then(data => { setGenres(data || []); setLoading(false) })
  }, [])

  return (
    <div className="bg-[#0B0B0F] min-h-screen">
      <div className="ott-container py-10 md:py-14">

        {/* Header */}
        <div className="mb-10 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight text-cinematic">Browse Genres</h1>
          <p className="text-white/35 text-sm mt-2 font-medium">Discover movies and series by category</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {loading
            ? Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="h-32 sm:h-36 md:h-40 rounded-2xl bg-white/5" />
              ))
            : genres.map((genre, i) => (
                <GenreCard key={genre.id} genre={genre} index={i} />
              ))
          }
        </div>

        {!loading && genres.length === 0 && (
          <div className="text-center py-24">
            <p className="text-white/25 text-sm">No genres yet. Import some movies to auto-create genres.</p>
          </div>
        )}
      </div>
    </div>
  )
}
