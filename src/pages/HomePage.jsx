import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Play, Star, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, TrendingUp, Gem, Tv, Film } from 'lucide-react'
import { movieService, seriesService } from '../services/media'
import { sectionService } from '../services/admin'
import { supabase } from '../services/supabase'
import { watchlistService } from '../services/social'
import { useAuthStore } from '../store/authStore'
import MediaRow from '../components/MediaRow'
import SearchBar from '../components/SearchBar'
import { Skeleton, Badge, Button } from '../components/ui'
import { formatYear, getGenreNames, cn } from '../utils/helpers'

/* ── Hero Slide ── */
function HeroSlide({ item, type, active }) {
  const title  = type === 'movie' ? item.title : item.name
  const date   = type === 'movie' ? item.release_date : item.first_air_date
  const genres = getGenreNames(item.genres)
  const { user } = useAuthStore()
  const [inWl, setInWl] = useState(false)
  const [wlLoading, setWlLoading] = useState(false)

  const toggleWl = async (e) => {
    e.preventDefault()
    if (!user || wlLoading) return
    setWlLoading(true)
    try {
      if (inWl) { await watchlistService.remove(user.id, item.id, type); setInWl(false) }
      else       { await watchlistService.add(user.id, item.id, type);    setInWl(true)  }
    } finally { setWlLoading(false) }
  }

  return (
    <div className={cn(
      'absolute inset-0 transition-opacity duration-700 ease-smooth',
      active ? 'opacity-100' : 'opacity-0 pointer-events-none'
    )}>
      {/* Backdrop with Ken Burns */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={item.backdrop || item.poster}
          alt={title}
          className={cn('w-full h-full object-cover', active && 'animate-ken-burns')}
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-end">
        <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 pb-20 md:pb-24 w-full">
          <div className={cn('max-w-xl', active && 'stagger')}>
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge variant="glass" className="gap-1.5 text-xs">
                {type === 'movie' ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
                {type === 'movie' ? 'Movie' : 'Series'}
              </Badge>
              {genres.slice(0, 2).map(g => (
                <Badge key={g} variant="glass" className="text-xs">{g}</Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.02] tracking-tight mb-3">
              {title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-3 text-sm mb-4">
              {item.vote_average > 0 && (
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Star className="h-4 w-4 fill-current" />
                  {item.vote_average.toFixed(1)}
                  <span className="text-white/40 font-normal text-xs">/ 10</span>
                </span>
              )}
              <span className="text-white/30">·</span>
              <span className="text-white/60">{formatYear(date)}</span>
            </div>

            {/* Overview */}
            <p className="text-white/70 text-sm md:text-[15px] leading-relaxed line-clamp-3 mb-7 max-w-lg">
              {item.overview}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link to={`/${type}/${item.id}`}>
                <Button size="lg" className="bg-white text-black hover:bg-white/92 shadow-none font-bold gap-2.5 rounded-xl">
                  <Play className="h-4 w-4 fill-black" />
                  View Details
                </Button>
              </Link>
              {user && (
                <Button variant="glass" size="lg" onClick={toggleWl} disabled={wlLoading} className="gap-2.5 font-semibold">
                  {inWl
                    ? <BookmarkCheck className="h-4 w-4 text-primary" />
                    : <Bookmark className="h-4 w-4" />
                  }
                  {inWl ? 'Saved' : 'Watchlist'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Hero Skeleton ── */
function HeroSkeleton() {
  return (
    <div className="relative h-[78vh] min-h-[540px] bg-muted overflow-hidden">
      <div className="absolute inset-0 shimmer" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      <div className="absolute bottom-20 left-4 sm:left-10 space-y-4 max-w-lg">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-16 w-80 md:w-[480px] rounded-2xl" />
        <Skeleton className="h-4 w-40 rounded-lg" />
        <Skeleton className="h-14 w-72 rounded-xl" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-11 w-36 rounded-xl" />
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/* ── Main ── */
export default function HomePage() {
  const [featured,       setFeatured]       = useState([])
  const [heroIdx,        setHeroIdx]        = useState(0)
  const [sections,       setSections]       = useState([])
  const [sectionMedia,   setSectionMedia]   = useState({})
  const [trendingMovies, setTrendingMovies] = useState([])
  const [trendingSeries, setTrendingSeries] = useState([])
  const [hiddenGems,     setHiddenGems]     = useState([])
  const [loading,        setLoading]        = useState(true)
  const autoRef = useRef(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [movies, series, sects, gems] = await Promise.all([
        movieService.getTrending(8),
        seriesService.getTrending(8),
        sectionService.getActiveSections(),
        supabase.from('movies')
          .select('id,title,poster,vote_average,release_date,genres,popularity')
          .gte('vote_average', 7.5).lte('popularity', 30)
          .order('vote_average', { ascending: false }).limit(10),
      ])

      const heroItems = [
        ...movies.filter(m => m.backdrop).slice(0, 4).map(m => ({ ...m, _type: 'movie' })),
        ...series.filter(s => s.backdrop).slice(0, 2).map(s => ({ ...s, _type: 'series' })),
      ]
      setFeatured(heroItems)
      setTrendingMovies(movies.map(m => ({ ...m, _type: 'movie' })))
      setTrendingSeries(series.map(s => ({ ...s, _type: 'series' })))
      setHiddenGems((gems.data || []).map(m => ({ ...m, _type: 'movie' })))
      setSections(sects)

      const mediaMap = {}
      for (const section of sects) {
        const items = section.section_items || []
        const movieIds  = items.filter(i => i.media_type === 'movie').map(i => i.media_id)
        const seriesIds = items.filter(i => i.media_type === 'series').map(i => i.media_id)
        const [md, sd] = await Promise.all([
          movieIds.length  > 0 ? supabase.from('movies').select('id,title,poster,vote_average,release_date,genres').in('id', movieIds)  : { data: [] },
          seriesIds.length > 0 ? supabase.from('series').select('id,name,poster,vote_average,first_air_date,genres').in('id', seriesIds) : { data: [] },
        ])
        mediaMap[section.id] = items
          .map(i => {
            const found = i.media_type === 'movie'
              ? (md.data || []).find(m => m.id === i.media_id)
              : (sd.data || []).find(s => s.id === i.media_id)
            return found ? { ...found, _type: i.media_type } : null
          })
          .filter(Boolean)
      }
      setSectionMedia(mediaMap)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (featured.length < 2) return
    autoRef.current = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 7000)
    return () => clearInterval(autoRef.current)
  }, [featured.length])

  const goHero = (idx) => { clearInterval(autoRef.current); setHeroIdx(idx) }

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative h-[78vh] min-h-[540px] overflow-hidden">
        {loading ? <HeroSkeleton /> : (
          <>
            {featured.map((item, i) => (
              <HeroSlide key={`${item._type}-${item.id}`} item={item} type={item._type} active={i === heroIdx} />
            ))}

            {featured.length > 1 && (
              <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
                <button onClick={() => goHero((heroIdx - 1 + featured.length) % featured.length)}
                  className="h-7 w-7 flex items-center justify-center rounded-full glass hover:bg-white/20 transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5 text-white" />
                </button>
                <div className="flex items-center gap-1.5">
                  {featured.map((_, i) => (
                    <button key={i} onClick={() => goHero(i)}
                      className={cn(
                        'rounded-full transition-all duration-350 ease-smooth',
                        i === heroIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/35 hover:bg-white/55'
                      )} />
                  ))}
                </div>
                <button onClick={() => goHero((heroIdx + 1) % featured.length)}
                  className="h-7 w-7 flex items-center justify-center rounded-full glass hover:bg-white/20 transition-colors">
                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Floating Search ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10 mb-14">
        <div className="bg-card/90 backdrop-blur-2xl border border-border/50 rounded-2xl p-3 shadow-card-xl">
          <SearchBar className="w-full" />
        </div>
      </div>

      {/* ── Content rows ── */}
      <div className="space-y-2">
        {loading ? (
          <>
            <MediaRow title="Trending Movies" loading />
            <MediaRow title="Popular Series"  loading />
          </>
        ) : (
          <>
            {sections.map(section => {
              const items = sectionMedia[section.id] || []
              if (!items.length) return null
              return (
                <MediaRow key={section.id} title={section.title} items={items}
                  type={section.type === 'series' ? 'series' : 'movie'} />
              )
            })}

            {trendingMovies.length > 0 && (
              <MediaRow
                title={<span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Trending Movies</span>}
                items={trendingMovies} type="movie" viewAllHref="/movies"
              />
            )}
            {trendingSeries.length > 0 && (
              <MediaRow
                title={<span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-violet-500" />Popular Series</span>}
                items={trendingSeries} type="series" viewAllHref="/series"
              />
            )}
            {hiddenGems.length > 0 && (
              <MediaRow
                title={<span className="flex items-center gap-2"><Gem className="h-5 w-5 text-amber-500" />Hidden Gems</span>}
                items={hiddenGems} type="movie"
              />
            )}

            {!loading && trendingMovies.length === 0 && trendingSeries.length === 0 && sections.length === 0 && (
              <div className="text-center py-28 px-4">
                <div className="text-7xl mb-5">🎬</div>
                <h2 className="text-2xl font-bold mb-2">No content yet</h2>
                <p className="text-muted-foreground mb-7 max-w-sm mx-auto">Import movies and series from the admin panel to get started.</p>
                <Link to="/admin/import"><Button size="lg">Go to Admin Import</Button></Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
