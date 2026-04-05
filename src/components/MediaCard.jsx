import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { cn, formatYear, getGenreNames } from '../utils/helpers'
import { Skeleton } from './ui'

export default function MediaCard({ item, type = 'movie', className = '' }) {
  const title = type === 'movie' ? item.title : item.name
  const date = type === 'movie' ? item.release_date : item.first_air_date
  const href = `/${type}/${item.id}`
  const genres = getGenreNames(item.genres)

  return (
    <Link to={href} className={cn('group block flex-shrink-0', className)}>
      <div className="relative overflow-hidden rounded-2xl bg-muted aspect-[2/3] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl">
        {item.poster ? (
          <img src={item.poster} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs text-center p-2">
            {title}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-1 text-yellow-400 text-xs mb-1">
            <Star className="h-3 w-3 fill-current" />
            <span>{item.vote_average?.toFixed(1) || 'N/A'}</span>
          </div>
          {genres.length > 0 && (
            <div className="text-white/70 text-xs line-clamp-1">{genres.slice(0, 2).join(' · ')}</div>
          )}
        </div>
        {item.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-white text-xs font-medium">{item.vote_average?.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="mt-2 px-1">
        <h3 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs text-muted-foreground">{formatYear(date)}</p>
      </div>
    </Link>
  )
}

export function MediaCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-36">
      <Skeleton className="aspect-[2/3] rounded-2xl w-full" />
      <Skeleton className="h-4 mt-2 w-3/4" />
      <Skeleton className="h-3 mt-1 w-1/2" />
    </div>
  )
}
