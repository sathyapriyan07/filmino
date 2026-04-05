import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Bookmark, BookmarkCheck, Play } from 'lucide-react'
import { cn, formatYear, getGenreNames } from '../utils/helpers'
import { Skeleton } from './ui'
import { useAuthStore } from '../store/authStore'
import { watchlistService } from '../services/social'

function BlurImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={cn(
        'w-full h-full object-cover transition-all duration-700 ease-smooth will-change-transform',
        loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[1.04] blur-md'
      )}
    />
  )
}

export default function MediaCard({ item, type = 'movie', className = '', showQuickActions = true }) {
  const title = type === 'movie' ? item.title : item.name
  const date  = type === 'movie' ? item.release_date : item.first_air_date
  const href  = `/${type}/${item.id}`
  const { user } = useAuthStore()
  const [inWl, setInWl] = useState(item._inWatchlist || false)
  const [wlLoading, setWlLoading] = useState(false)

  const toggleWl = async (e) => {
    e.preventDefault(); e.stopPropagation()
    if (!user || wlLoading) return
    setWlLoading(true)
    try {
      if (inWl) { await watchlistService.remove(user.id, item.id, type); setInWl(false) }
      else       { await watchlistService.add(user.id, item.id, type);    setInWl(true)  }
    } finally { setWlLoading(false) }
  }

  return (
    <Link to={href} className={cn('group block flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl', className)}>
      {/* ── Poster ── */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl bg-muted aspect-[2/3]',
        'transition-all duration-350 ease-smooth',
        'group-hover:scale-[1.05]',
        'group-hover:shadow-[0_8px_32px_rgba(99,102,241,0.35),0_2px_8px_rgba(0,0,0,0.4)]',
        'shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
      )}>

        {item.poster
          ? <BlurImage src={item.poster} alt={title} />
          : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60 p-3">
              <span className="text-muted-foreground text-xs font-medium text-center line-clamp-3">{title}</span>
            </div>
          )
        }

        {/* Rating pill */}
        {item.vote_average > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-black/70 backdrop-blur-md rounded-full px-1.5 py-0.5">
            <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-white text-[10px] font-semibold leading-none">{item.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-350 ease-smooth" />

        {/* Hover action bar */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 p-2.5',
          'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
          'transition-all duration-300 ease-smooth'
        )}>
          <div className="flex items-center justify-between gap-1.5">
            <div className="p-1.5 rounded-lg glass">
              <Play className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            {showQuickActions && user && (
              <button
                onClick={toggleWl}
                disabled={wlLoading}
                aria-label={inWl ? 'Remove from watchlist' : 'Add to watchlist'}
                className="p-1.5 rounded-lg glass hover:bg-white/25 transition-colors duration-150 active:scale-90"
              >
                {inWl
                  ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                  : <Bookmark className="h-3.5 w-3.5 text-white" />
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="mt-2.5 px-0.5 space-y-0.5">
        <h3 className="text-sm font-medium line-clamp-1 text-white/90 group-hover:text-primary transition-colors duration-200 leading-snug">
          {title}
        </h3>
        <p className="text-xs text-white/40 leading-none">{formatYear(date)}</p>
      </div>
    </Link>
  )
}

export function MediaCardSkeleton({ className }) {
  return (
    <div className={cn('flex-shrink-0', className)}>
      <Skeleton className="aspect-[2/3] rounded-2xl w-full" />
      <Skeleton className="h-3 mt-2.5 w-3/4 rounded-md" />
      <Skeleton className="h-2.5 mt-1.5 w-1/3 rounded-md" />
    </div>
  )
}
