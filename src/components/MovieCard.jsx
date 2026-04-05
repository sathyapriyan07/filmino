import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Plus, Check, Play } from 'lucide-react'
import { cn, formatYear, getGenreNames } from '../utils/helpers'
import { Skeleton } from './ui'
import { useAuthStore } from '../store/authStore'
import { watchlistService } from '../services/social'

/* ── Blur-up lazy image ── */
function LazyPoster({ src, alt }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={cn(
        'w-full h-full object-cover transition-all duration-500 select-none',
        loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[1.04] blur-sm'
      )}
      draggable={false}
    />
  )
}

export default function MovieCard({
  item,
  type = 'movie',
  width = 'w-[130px] sm:w-[145px] md:w-[155px]',
}) {
  const title  = type === 'movie' ? item.title : item.name
  const date   = type === 'movie' ? item.release_date : item.first_air_date
  const genres = getGenreNames(item.genres).slice(0, 2)
  const href   = `/${type}/${item.id}`

  const { user } = useAuthStore()
  const [inWl,    setInWl]    = useState(item._inWatchlist || false)
  const [wlBusy,  setWlBusy]  = useState(false)
  const [hovered, setHovered] = useState(false)

  const toggleWl = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || wlBusy) return
    setWlBusy(true)
    try {
      if (inWl) { await watchlistService.remove(user.id, item.id, type); setInWl(false) }
      else       { await watchlistService.add(user.id, item.id, type);    setInWl(true)  }
    } finally { setWlBusy(false) }
  }

  return (
    <Link
      to={href}
      className={cn('flex-shrink-0 snap-start block outline-none group', width)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Poster wrapper ── */}
      <div
        className={cn(
          'relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5',
          'transition-all duration-350 ease-out will-change-transform',
          /* scale up + glow on hover */
          hovered
            ? 'scale-[1.06] shadow-[0_12px_40px_rgba(99,102,241,0.45),0_4px_16px_rgba(0,0,0,0.7)] z-10'
            : 'scale-100 shadow-[0_2px_10px_rgba(0,0,0,0.5)]',
          'active:scale-[0.97]'
        )}
      >
        {/* Poster image */}
        {item.poster
          ? <LazyPoster src={item.poster} alt={title} />
          : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02] p-3">
              <span className="text-white/25 text-[10px] text-center leading-tight line-clamp-4">{title}</span>
            </div>
          )
        }

        {/* ── Always-visible rating badge (top-left) ── */}
        {item.vote_average > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-black/75 backdrop-blur-sm rounded-full px-1.5 py-[3px] z-10">
            <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-white text-[10px] font-bold leading-none">
              {item.vote_average.toFixed(1)}
            </span>
          </div>
        )}

        {/* ── Hover: dark gradient overlay ── */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10',
            'transition-opacity duration-300',
            hovered ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* ── Hover: metadata panel (slides up from bottom) ── */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-8',
            'transition-all duration-350 ease-out',
            hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )}
        >
          {/* Genre tags */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {genres.map(g => (
                <span
                  key={g}
                  className="text-[9px] font-semibold text-white/60 bg-white/10 rounded-full px-1.5 py-[2px] leading-none"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Year + rating row */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-white/55">{formatYear(date)}</span>
            {item.vote_average > 0 && (
              <span className="flex items-center gap-0.5 text-amber-400">
                <Star className="h-2.5 w-2.5 fill-current" />
                <span className="text-[11px] font-bold text-white">{item.vote_average.toFixed(1)}</span>
              </span>
            )}
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-1.5">
            {/* Play */}
            <div className="flex items-center gap-1 flex-1 justify-center h-7 rounded-lg bg-white text-black text-[11px] font-bold">
              <Play className="h-3 w-3 fill-black flex-shrink-0" />
              Play
            </div>

            {/* Watchlist */}
            {user && (
              <button
                onClick={toggleWl}
                disabled={wlBusy}
                aria-label={inWl ? 'Remove from watchlist' : 'Add to watchlist'}
                className="flex items-center justify-center h-7 w-7 rounded-lg bg-white/15 border border-white/20 text-white hover:bg-white/25 active:scale-90 transition-all flex-shrink-0"
              >
                {inWl
                  ? <Check className="h-3 w-3 text-indigo-400" />
                  : <Plus className="h-3 w-3" />
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Below-card info ── */}
      <div className="mt-2 px-0.5">
        <p
          className={cn(
            'text-[12px] font-semibold leading-tight line-clamp-1 transition-colors duration-200',
            hovered ? 'text-indigo-400' : 'text-white/80'
          )}
        >
          {title}
        </p>
        <p className="text-[11px] text-white/30 mt-0.5 leading-none">{formatYear(date)}</p>
      </div>
    </Link>
  )
}

export function MovieCardSkeleton({ width = 'w-[130px] sm:w-[145px] md:w-[155px]' }) {
  return (
    <div className={cn('flex-shrink-0 snap-start', width)}>
      <div className="aspect-[2/3] rounded-xl bg-white/5 shimmer" />
      <div className="h-3 mt-2 w-3/4 rounded bg-white/5 shimmer" />
      <div className="h-2.5 mt-1.5 w-1/3 rounded bg-white/5 shimmer" />
    </div>
  )
}
