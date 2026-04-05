import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import MediaCard, { MediaCardSkeleton } from './MediaCard'
import { cn } from '../utils/helpers'

export default function MediaRow({ title, items = [], type = 'movie', loading = false, viewAllHref, className }) {
  const scrollRef = useRef(null)

  const scroll = (dir) => {
    if (scrollRef.current) {
      const cardW = scrollRef.current.querySelector('a, div')?.offsetWidth || 160
      scrollRef.current.scrollBy({ left: dir * (cardW + 16) * 3, behavior: 'smooth' })
    }
  }

  const skeletonCount = 8

  return (
    <section className={cn('mb-10', className)}>
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <h2 className="text-lg md:text-xl font-bold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link to={viewAllHref} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium mr-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          <button
            onClick={() => scroll(-1)}
            className="p-1.5 rounded-full bg-secondary hover:bg-accent transition-colors hidden sm:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="p-1.5 rounded-full bg-secondary hover:bg-accent transition-colors hidden sm:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-0 pb-2 snap-x-mandatory"
      >
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
            <MediaCardSkeleton key={i} className="w-[120px] sm:w-[140px] md:w-[152px] snap-start" />
          ))
          : items.map(item => (
            <MediaCard
              key={`${item._type || type}-${item.id}`}
              item={item}
              type={item._type || type}
              className="w-[120px] sm:w-[140px] md:w-[152px] snap-start"
            />
          ))
        }
      </div>
    </section>
  )
}
