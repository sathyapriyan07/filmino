import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { cn } from '../utils/helpers'

export default function Top10List({ items = [], type = 'movie', title = 'Top 10 This Week' }) {
  if (!items.length) return null

  return (
    <section className="mb-12 md:mb-14 px-4 sm:px-6 lg:px-10 xl:px-16">
      <h2 className="text-lg md:text-xl font-semibold tracking-tight text-foreground mb-5">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.slice(0, 10).map((item, i) => {
          const itemTitle = type === 'movie' ? item.title : item.name
          const href = `/${type}/${item.id}`
          return (
            <Link
              key={item.id}
              to={href}
              className="group flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-3 hover:bg-accent/50 hover:border-border transition-all duration-200"
            >
              {/* Rank number */}
              <span className={cn(
                'text-4xl font-black leading-none flex-shrink-0 w-10 text-center',
                i < 3 ? 'gradient-text' : 'text-muted-foreground/30'
              )}>
                {i + 1}
              </span>

              {/* Poster */}
              <div className="w-10 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {item.poster
                  ? <img src={item.poster} alt={itemTitle} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">{itemTitle?.[0]}</div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{itemTitle}</div>
                {item.vote_average > 0 && (
                  <div className="flex items-center gap-1 mt-0.5 text-amber-400">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs font-medium">{item.vote_average.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
