import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../utils/helpers'

export default function CastCarousel({ cast, initialCount = 12 }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? cast : cast.slice(0, initialCount)

  return (
    <section>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {visible.map(c => (
          <Link
            key={c.id}
            to={`/person/${c.person_id}`}
            className="group text-center"
          >
            <div className={cn(
              'aspect-square rounded-2xl overflow-hidden bg-white/5 mb-2.5',
              'border border-white/8 transition-all duration-300',
              'group-hover:scale-[1.04] group-hover:shadow-[0_8px_32px_rgba(99,102,241,0.35)] group-hover:border-indigo-500/30'
            )}>
              {c.persons?.profile_image ? (
                <img
                  src={c.persons.profile_image}
                  alt={c.persons.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/20">
                  {c.persons?.name?.[0]}
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-white/80 line-clamp-1 group-hover:text-indigo-400 transition-colors">
              {c.persons?.name}
            </p>
            {c.character && (
              <p className="text-[10px] text-white/30 line-clamp-1 mt-0.5">{c.character}</p>
            )}
          </Link>
        ))}
      </div>

      {cast.length > initialCount && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
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
