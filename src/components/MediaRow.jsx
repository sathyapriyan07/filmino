import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MediaCard, { MediaCardSkeleton } from './MediaCard'

export default function MediaRow({ title, items = [], type = 'movie', loading = false }) {
  const scrollRef = useRef(null)

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' })
    }
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="p-1.5 rounded-full bg-secondary hover:bg-accent transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll(1)} className="p-1.5 rounded-full bg-secondary hover:bg-accent transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-0 pb-2"
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <MediaCardSkeleton key={i} />)
          : items.map(item => (
            <MediaCard
              key={item.id}
              item={item}
              type={type}
              className="w-32 sm:w-36 md:w-40"
            />
          ))
        }
      </div>
    </section>
  )
}
