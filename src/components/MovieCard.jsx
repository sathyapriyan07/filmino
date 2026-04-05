import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Plus, Check, Play } from 'lucide-react'
import { cn, formatYear } from '../utils/helpers'
import { Skeleton } from './ui'
import { useAuthStore } from '../store/authStore'
import { watchlistService } from '../services/social'

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
        'w-full h-full object-cover transition-all duration-500',
        loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-[1.03]'
      )}
    />
  )
}

export default function MovieCard({ item, type = 'movie', width = 'w-[130px] sm:w-[140px]' }) {
  const title = type === 'movie' ? item.title : item.name
  const date  = type === 'movie' ? item.release_date : item.first_air_date
  const href  = `/${type}/${item.id}`
  const { user } = useAuthStore()
  const [inWl, setInWl]     = useState(item._inWatchlist || false)
  const [wlBusy, setWlBusy] = useState(false)
  const [hovered, setHovered] = useState(false)

  const toggleWl = async (e) => {
    e.preventDefault(); e.stopPropagation()
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
      className={cn('flex-shrink-0 snap-start block outline-none', width)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <div className={cn(
        'relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5',
        'transition-all duration-300',
        'shadow-[0_2px_12px_rgba(0,0,0,0.5)]',
        hovered && 'scale-[1.04] shadow-[0_8px_32px_rgba(99,102,241,0.4),0_4px_16px_rgba(0,0,0,0.6)]',
        'active:scale-[0.97]'
      )}>
        {item.poster
          ? <LazyPoster src={item.poster} alt={title} />
          : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02] p-2">
              <span className="text-white/30 text-[10px] text-center leading-tight line-clamp-3">{title}</span>
            </div>
          )
        }

        {/* Rating badge */}
        {item.vote_average > 0 && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-[3px]">
            <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
            <span className="text-white text-[10px] font-bold leading-none">{item.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent',
          'transition-opacity duration-300',
          hovered ? 'opacity-100' : 'opacity-0'
        )} />

        {/* Hover actions */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between',
          'transition-all duration-300',
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}>
          <div className="h-7 w-7 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
            <Play className="h-3 w-3 text-white fill-white ml-0.5" />
          </div>
          {user && (
            <button
              onClick={toggleWl}
              disabled={wlBusy}
              className="h-7 w-7 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/20 active:scale-90 transition-transform"
            >
              {inWl
                ? <Check className="h-3 w-3 text-primary" />
                : <Plus className="h-3 w-3 text-white" />
              }
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <p className={cn(
          'text-[12px] font-medium leading-tight line-clamp-1 transition-colors duration-200',
          hovered ? 'text-primary' : 'text-white/85'
        )}>
          {title}
        </p>
        <p className="text-[11px] text-white/35 mt-0.5 leading-none">{formatYear(date)}</p>
      </div>
    </Link>
  )
}

export function MovieCardSkeleton({ width = 'w-[130px] sm:w-[140px]' }) {
  return (
    <div className={cn('flex-shrink-0 snap-start', width)}>
      <Skeleton className="aspect-[2/3] rounded-xl w-full" />
      <Skeleton className="h-3 mt-2 w-3/4 rounded" />
      <Skeleton className="h-2.5 mt-1 w-1/3 rounded" />
    </div>
  )
}
