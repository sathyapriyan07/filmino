import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import MediaCard, { MediaCardSkeleton } from './MediaCard'
import { cn } from '../utils/helpers'

export default function MediaRow({ title, items = [], type = 'movie', loading = false, viewAllHref, className }) {
  const scrollRef = useRef(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(true)

  const updateArrows = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const cardW = el.querySelector('a')?.offsetWidth || 152
    el.scrollBy({ left: dir * (cardW + 16) * 3, behavior: 'smooth' })
    setTimeout(updateArrows, 350)
  }

  return (
    <section className={cn('mb-12 md:mb-14', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-5 px-4 sm:px-6 lg:px-10 xl:px-16">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight text-foreground leading-tight">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="text-xs font-medium text-primary hover:text-primary/75 transition-colors flex items-center gap-1 mr-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {/* Scroll buttons — desktop only */}
          <button
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className={cn(
              'hidden sm:flex h-8 w-8 items-center justify-center rounded-full',
              'bg-secondary/80 hover:bg-secondary border border-border/50',
              'transition-all duration-200 ease-smooth',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              canLeft && 'hover:shadow-card-md hover:scale-105'
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canRight}
            className={cn(
              'hidden sm:flex h-8 w-8 items-center justify-center rounded-full',
              'bg-secondary/80 hover:bg-secondary border border-border/50',
              'transition-all duration-200 ease-smooth',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              canRight && 'hover:shadow-card-md hover:scale-105'
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scroll track */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-1 snap-x-mandatory px-4 sm:px-6 lg:px-10 xl:px-16"
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <MediaCardSkeleton key={i} className="w-[130px] sm:w-[148px] md:w-[160px] flex-shrink-0 snap-start" />
            ))
          : items.map(item => (
              <MediaCard
                key={`${item._type || type}-${item.id}`}
                item={item}
                type={item._type || type}
                className="w-[130px] sm:w-[148px] md:w-[160px] flex-shrink-0 snap-start"
              />
            ))
        }
      </div>
    </section>
  )
}
