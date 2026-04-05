import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function CastCarousel({ cast, initialCount = 10 }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? cast : cast.slice(0, initialCount)

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Cast</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {visible.map(c => (
          <Link key={c.id} to={`/person/${c.person_id}`} className="group text-center">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2 ring-1 ring-border/40 group-hover:ring-primary/40 transition-all duration-200">
              {c.persons?.profile_image ? (
                <img
                  src={c.persons.profile_image}
                  alt={c.persons.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground font-bold">
                  {c.persons?.name?.[0]}
                </div>
              )}
            </div>
            <div className="text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">{c.persons?.name}</div>
            {c.character && <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{c.character}</div>}
          </Link>
        ))}
      </div>
      {cast.length > initialCount && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-4 text-sm text-primary flex items-center gap-1 hover:underline"
        >
          {showAll
            ? <><ChevronUp className="h-4 w-4" /> Show less</>
            : <><ChevronDown className="h-4 w-4" /> Show all {cast.length} cast members</>
          }
        </button>
      )}
    </section>
  )
}
