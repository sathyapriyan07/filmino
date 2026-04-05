import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Bookmark, BookmarkCheck, Play } from 'lucide-react'
import { cn, formatYear, getGenreNames } from '../utils/helpers'
import { Skeleton } from './ui'
import { useAuthStore } from '../store/authStore'
import { watchlistService } from '../services/social'

function BlurImage({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      className={cn('w-full h-full object-cover transition-all duration-500', !loaded && 'scale-105 blur-sm', loaded && 'scale-100 blur-0', className)}
    />
  )
}

export default function MediaCard({ item, type = 'movie', className = '', showQuickActions = true }) {
  const title = type === 'movie' ? item.title : item.name
  const date = type === 'movie' ? item.release_date : item.first_air_date
  const href = `/${type}/${item.id}`
  const genres = getGenreNames(item.genres)
  const { user } = useAuthStore()
  const [inWatchlist, setInWatchlist] = useState(item._inWatchlist || false)
  const [wlLoading, setWlLoading] = useState(false)

  const toggleWatchlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || wlLoading) return
    setWlLoading(true)
    try {
      if (inWatchlist) {
        await watchlistService.remove(user.id, item.id, type)
        setInWatchlist(false)
      } else {
        await watchlistService.add(user.id, item.id, type)
        setInWatchlist(true)
      }
    } finally {
      setWlLoading(false)
    }
  }

  return (
    <Link to={href} className={cn('group block flex-shrink-0 animate-fade-in', className)}>
      <div className="relative overflow-hidden rounded-2xl bg-muted aspect-[2/3] shadow-card transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-card-hover">
        {item.poster ? (
          <BlurImage src={item.poster} alt={title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground text-xs text-center p-3 font-medium">
            {title}
          </div>
        )}

        {/* Always-visible rating badge */}
        {item.vote_average > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5">
            <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
            <span className="text-white text-[10px] font-semibold">{item.vote_average?.toFixed(1)}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover content */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          {genres.length > 0 && (
            <div className="text-white/70 text-[10px] mb-1.5 line-clamp-1">{genres.slice(0, 2).join(' · ')}</div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="flex-1 flex items-center gap-1 text-yellow-400 text-xs">
              <Star className="h-3 w-3 fill-current" />
              {item.vote_average?.toFixed(1) || 'N/A'}
            </span>
            {showQuickActions && user && (
              <button
                onClick={toggleWatchlist}
                disabled={wlLoading}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 backdrop-blur-sm transition-colors"
                title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                {inWatchlist
                  ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                  : <Bookmark className="h-3.5 w-3.5 text-white" />
                }
              </button>
            )}
            <div className="p-1.5 rounded-lg bg-white/15 backdrop-blur-sm">
              <Play className="h-3.5 w-3.5 text-white fill-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 px-0.5">
        <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors duration-200">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{formatYear(date)}</p>
      </div>
    </Link>
  )
}

export function MediaCardSkeleton({ className }) {
  return (
    <div className={cn('flex-shrink-0', className)}>
      <Skeleton className="aspect-[2/3] rounded-2xl w-full" />
      <Skeleton className="h-3.5 mt-2.5 w-3/4 rounded-lg" />
      <Skeleton className="h-3 mt-1.5 w-1/3 rounded-lg" />
    </div>
  )
}
