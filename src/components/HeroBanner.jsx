import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Play, Plus, Check, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { watchlistService } from '../services/social'
import { useAuthStore } from '../store/authStore'
import { getGenreNames, formatYear, cn } from '../utils/helpers'
import { Skeleton } from './ui'

function HeroSlide({ item, type, active }) {
  const title = type === 'movie' ? item.title : item.name
  const date  = type === 'movie' ? item.release_date : item.first_air_date
  const genres = getGenreNames(item.genres).slice(0, 3)
  const href  = `/${type}/${item.id}`
  const { user } = useAuthStore()
  const [inWl, setInWl] = useState(false)
  const [wlBusy, setWlBusy] = useState(false)

  const toggleWl = async (e) => {
    e.preventDefault()
    if (!user || wlBusy) return
    setWlBusy(true)
    try {
      if (inWl) { await watchlistService.remove(user.id, item.id, type); setInWl(false) }
      else       { await watchlistService.add(user.id, item.id, type);    setInWl(true)  }
    } finally { setWlBusy(false) }
  }

  return (
    <div className={cn(
      'absolute inset-0 transition-opacity duration-700',
      active ? 'opacity-100' : 'opacity-0 pointer-events-none'
    )}>
      {/* Backdrop image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={item.backdrop || item.poster}
          alt={title}
          className={cn('w-full h-full object-cover object-center', active && 'animate-ken-burns')}
        />
      </div>

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/50 to-[#0B0B0F]/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F]/80 via-transparent to-transparent" />

      {/* Centered play button */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <Link
          to={href}
          className={cn(
            'pointer-events-auto flex items-center justify-center',
            'h-[72px] w-[72px] rounded-full',
            'bg-white/10 backdrop-blur-sm border-2 border-white/40',
            'shadow-[0_0_48px_rgba(255,255,255,0.12)]',
            'transition-all duration-300 active:scale-90',
            'hero-play-btn',
            active ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}
          style={{ transitionDelay: active ? '350ms' : '0ms' }}
        >
          <Play className="h-8 w-8 text-white fill-white ml-1" />
        </Link>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-28 md:pb-24 md:px-10">
        <div className={cn(active && 'hero-content-enter')}>
          {/* Genre pills */}
          {genres.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {genres.map(g => (
                <span key={g} className="text-[11px] font-medium text-white/70 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-2.5 py-0.5">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-[2rem] sm:text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tight mb-2.5 max-w-lg">
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-2.5 mb-5 text-sm">
            {item.vote_average > 0 && (
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="h-3.5 w-3.5 fill-current" />
                {item.vote_average.toFixed(1)}
              </span>
            )}
            {item.vote_average > 0 && <span className="text-white/25">·</span>}
            <span className="text-white/55 font-medium">{formatYear(date)}</span>
            <span className="text-white/25">·</span>
            <span className="text-white/55 font-medium capitalize">{type}</span>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              to={href}
              className="flex items-center gap-2 h-11 px-6 rounded-full bg-white text-black text-sm font-bold active:scale-95 transition-transform"
            >
              <Play className="h-4 w-4 fill-black" />
              View Details
            </Link>
            {user && (
              <button
                onClick={toggleWl}
                disabled={wlBusy}
                className="flex items-center justify-center h-11 w-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white active:scale-95 transition-transform"
              >
                {inWl ? <Check className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HeroBanner({ items = [], loading = false }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)

  const startTimer = () => {
    clearInterval(timerRef.current)
    if (items.length > 1) {
      timerRef.current = setInterval(() => setIdx(i => (i + 1) % items.length), 6000)
    }
  }

  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current) }, [items.length])

  const go = (i) => { setIdx(i); startTimer() }

  if (loading) {
    return (
      <div className="relative h-[55vh] min-h-[420px] bg-[#0B0B0F] overflow-hidden">
        <div className="absolute inset-0 shimmer opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/40 to-transparent" />
        <div className="absolute bottom-28 left-4 space-y-3 w-64">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-10 w-56 rounded-xl" />
          <Skeleton className="h-4 w-24 rounded-lg" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-11 w-36 rounded-full" />
            <Skeleton className="h-11 w-11 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!items.length) return null

  return (
    <div className="relative h-[55vh] min-h-[420px] md:h-[70vh] overflow-hidden">
      {items.map((item, i) => (
        <HeroSlide
          key={`${item._type}-${item.id}`}
          item={item}
          type={item._type}
          active={i === idx}
        />
      ))}

      {/* Dot indicators + arrows */}
      {items.length > 1 && (
        <div className="absolute bottom-[72px] md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          <button
            onClick={() => go((idx - 1 + items.length) % items.length)}
            className="h-6 w-6 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/15"
          >
            <ChevronLeft className="h-3 w-3 text-white" />
          </button>
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={cn(
                  'rounded-full transition-all duration-400',
                  i === idx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'
                )}
              />
            ))}
          </div>
          <button
            onClick={() => go((idx + 1) % items.length)}
            className="h-6 w-6 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/15"
          >
            <ChevronRight className="h-3 w-3 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
