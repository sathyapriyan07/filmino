import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Play, Info, Plus, Check, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { watchlistService } from '../services/social'
import { useAuthStore } from '../store/authStore'
import { getGenreNames, formatYear, cn } from '../utils/helpers'

/* ── Progress bar for auto-rotate ── */
function ProgressBar({ active, duration, paused }) {
  return (
    <div className="h-[2px] w-full bg-white/15 rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full bg-white rounded-full origin-left',
          active && !paused ? 'animate-hero-progress' : '',
          !active ? 'w-0' : ''
        )}
        style={active && !paused ? { animationDuration: `${duration}ms` } : {}}
      />
    </div>
  )
}

/* ── Single hero slide ── */
function HeroSlide({ item, type, active }) {
  const title   = type === 'movie' ? item.title : item.name
  const date    = type === 'movie' ? item.release_date : item.first_air_date
  const genres  = getGenreNames(item.genres).slice(0, 3)
  const href    = `/${type}/${item.id}`
  const overview = item.overview || ''

  const { user } = useAuthStore()
  const [inWl,   setInWl]   = useState(false)
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
    <div
      className={cn(
        'absolute inset-0 transition-opacity duration-1000',
        active ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* ── Backdrop ── */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={item.backdrop || item.poster}
          alt={title}
          className={cn(
            'w-full h-full object-cover object-center select-none',
            active && 'animate-ken-burns'
          )}
          draggable={false}
        />
      </div>

      {/* ── Gradient layers ── */}
      {/* Bottom-to-top: strong black fade so text is always readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/60 to-transparent" />
      {/* Left-to-right: content side darkening */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F]/90 via-[#0B0B0F]/40 to-transparent" />
      {/* Top vignette so navbar stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

      {/* ── Content ── */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full px-5 sm:px-8 md:px-14 lg:px-20 pb-32 md:pb-24 max-w-[860px]">
          <div className={cn(active && 'hero-content-enter')}>

            {/* Genre + type badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 border border-white/15 rounded-full px-2.5 py-0.5">
                {type === 'movie' ? 'Movie' : 'Series'}
              </span>
              {genres.map(g => (
                <span key={g} className="text-[10px] font-semibold text-white/60 bg-white/8 border border-white/10 rounded-full px-2.5 py-0.5">
                  {g}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.0] tracking-tight mb-4 text-cinematic">
              {title}
            </h1>

            {/* Meta row */}
            <div className="flex items-center gap-3 mb-4 text-sm">
              {item.vote_average > 0 && (
                <span className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {item.vote_average.toFixed(1)}
                  <span className="text-white/30 font-normal text-xs">/ 10</span>
                </span>
              )}
              {item.vote_average > 0 && <span className="text-white/20">·</span>}
              <span className="text-white/50 font-medium">{formatYear(date)}</span>
            </div>

            {/* Description — hidden on small mobile, 2 lines on sm+ */}
            {overview && (
              <p className="hidden sm:block text-white/60 text-sm md:text-[15px] leading-relaxed line-clamp-2 mb-6 max-w-xl">
                {overview}
              </p>
            )}

            {/* CTA buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Play / View Details */}
              <Link
                to={href}
                className="flex items-center gap-2.5 h-12 px-7 rounded-full bg-white text-black text-sm font-black hover:bg-white/90 active:scale-95 transition-all shadow-[0_4px_24px_rgba(255,255,255,0.2)]"
              >
                <Play className="h-4 w-4 fill-black flex-shrink-0" />
                Play
              </Link>

              {/* More Info */}
              <Link
                to={href}
                className="flex items-center gap-2.5 h-12 px-7 rounded-full bg-white/12 backdrop-blur-md border border-white/20 text-white text-sm font-semibold hover:bg-white/20 active:scale-95 transition-all"
              >
                <Info className="h-4 w-4 flex-shrink-0" />
                More Info
              </Link>

              {/* Watchlist — icon only */}
              {user && (
                <button
                  onClick={toggleWl}
                  disabled={wlBusy}
                  aria-label={inWl ? 'Remove from watchlist' : 'Add to watchlist'}
                  className="flex items-center justify-center h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                  {inWl
                    ? <Check className="h-5 w-5 text-indigo-400" />
                    : <Plus className="h-5 w-5" />
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Skeleton ── */
function HeroSkeleton() {
  return (
    <div className="absolute inset-0 bg-[#0B0B0F]">
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/50 to-transparent" />
      <div className="absolute bottom-32 left-5 sm:left-14 space-y-4 w-72 sm:w-96">
        <div className="h-3 w-24 bg-white/8 rounded-full" />
        <div className="h-12 w-full bg-white/8 rounded-2xl" />
        <div className="h-3 w-32 bg-white/6 rounded-full" />
        <div className="h-4 w-full bg-white/5 rounded-lg" />
        <div className="h-4 w-4/5 bg-white/5 rounded-lg" />
        <div className="flex gap-3 pt-2">
          <div className="h-12 w-32 bg-white/10 rounded-full" />
          <div className="h-12 w-32 bg-white/6 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/* ── Main export ── */
const ROTATE_MS = 7000

export default function HeroBanner({ items = [], loading = false }) {
  const [idx,    setIdx]    = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  const startTimer = () => {
    clearInterval(timerRef.current)
    if (items.length > 1) {
      timerRef.current = setInterval(
        () => setIdx(i => (i + 1) % items.length),
        ROTATE_MS
      )
    }
  }

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [items.length])

  const go = (i) => { setIdx(i); startTimer() }
  const prev = () => go((idx - 1 + items.length) % items.length)
  const next = () => go((idx + 1) % items.length)

  return (
    <div
      className="relative w-full h-[62vh] min-h-[500px] md:h-[78vh] md:min-h-[600px] overflow-hidden bg-[#0B0B0F]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {loading
        ? <HeroSkeleton />
        : items.map((item, i) => (
            <HeroSlide
              key={`${item._type}-${item.id}`}
              item={item}
              type={item._type}
              active={i === idx}
            />
          ))
      }

      {/* ── Bottom controls bar ── */}
      {!loading && items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-5 sm:px-8 md:px-14 lg:px-20 pb-6 md:pb-8">
          <div className="flex items-center gap-4">

            {/* Prev / Next arrows */}
            <button
              onClick={prev}
              className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Progress bars — one per slide */}
            <div className="flex-1 flex items-center gap-1.5">
              {items.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 cursor-pointer"
                  onClick={() => go(i)}
                >
                  <ProgressBar
                    active={i === idx}
                    duration={ROTATE_MS}
                    paused={paused}
                  />
                </div>
              ))}
            </div>

            {/* Next arrow */}
            <button
              onClick={next}
              className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Slide counter */}
            <span className="text-[11px] font-semibold text-white/35 tabular-nums flex-shrink-0">
              {idx + 1} / {items.length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
