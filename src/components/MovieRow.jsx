import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import MovieCard, { MovieCardSkeleton } from './MovieCard'
import { cn } from '../utils/helpers'

export default function MovieRow({
  title,
  icon,
  items = [],
  type = 'movie',
  loading = false,
  viewAllHref,
  className,
}) {
  const trackRef   = useRef(null)
  const sectionRef = useRef(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(true)
  const [visible,  setVisible]  = useState(false)

  /* Slide-in on scroll */
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const syncArrows = () => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  const scroll = (dir) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('a') || el.querySelector('div')
    const step = (card?.offsetWidth || 140) * 3 + 12 * 3
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
    setTimeout(syncArrows, 380)
  }

  return (
    <section
      ref={sectionRef}
      className={cn(
        'mb-8 md:mb-10 transition-all duration-700',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        className
      )}
    >
      {/* Row header */}
      <div className="flex items-center justify-between px-4 md:px-10 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 flex-shrink-0" />
          <h2 className="text-[15px] md:text-base font-bold text-white tracking-tight flex items-center gap-2">
            {icon && <span className="text-base">{icon}</span>}
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors mr-1"
            >
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {/* Desktop scroll arrows */}
          <button
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className="hidden sm:flex h-7 w-7 items-center justify-center rounded-full bg-white/8 border border-white/10 text-white disabled:opacity-20 hover:bg-white/15 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canRight}
            className="hidden sm:flex h-7 w-7 items-center justify-center rounded-full bg-white/8 border border-white/10 text-white disabled:opacity-20 hover:bg-white/15 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scroll track */}
      <div
        ref={trackRef}
        onScroll={syncArrows}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory px-4 md:px-10"
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <MovieCardSkeleton key={i} />)
          : items.map(item => (
              <MovieCard
                key={`${item._type || type}-${item.id}`}
                item={item}
                type={item._type || type}
              />
            ))
        }
      </div>
    </section>
  )
}
