import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Play, Star, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, TrendingUp, Gem, Tv, Film, Sparkles, Clock, ThumbsUp, Info } from 'lucide-react'
import { movieService, seriesService } from '../services/media'
import { sectionService } from '../services/admin'
import { supabase } from '../services/supabase'
import { watchlistService } from '../services/social'
import { useAuthStore } from '../store/authStore'
import { usePersonalization } from '../hooks/usePersonalization'
import { getRecentlyViewed } from '../hooks/useRecentlyViewed'
import MediaRow from '../components/MediaRow'
import Top10List from '../components/Top10List'
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
      {/* Backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={item.backdrop || item.poster}
          alt={title}
          className={cn('w-full h-full object-cover', active && 'animate-ken-burns')}
        />
        {/* Cinematic gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
      </div>

      {/* Center play button (mobile-first) */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <Link
          to={`/${type}/${item.id}`}
          className={cn(
            'pointer-events-auto flex items-center justify-center',
            'h-16 w-16 rounded-full bg-white/15 backdrop-blur-md border border-white/30',
            'hover:bg-white/25 hover:scale-110 active:scale-95',
            'transition-all duration-300 ease-smooth shadow-[0_0_40px_rgba(255,255,255,0.15)]',
            active ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}
          style={{ transitionDelay: active ? '300ms' : '0ms' }}
        >
          <Play className="h-7 w-7 text-white fill-white ml-1" />
        </Link>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 lg:px-10 pb-24 md:pb-20">
        <div className={cn('max-w-xl', active && 'stagger')}>
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="glass" className="gap-1.5 text-xs">
              {type === 'movie' ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
              {type === 'movie' ? 'Movie' : 'Series'}
            </Badge>
            {genres.slice(0, 2).map(g => (
              <Badge key={g} variant="glass" className="text-xs">{g}</Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.02] tracking-tight mb-2">
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 text-sm mb-3">
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
          <p className="text-white/65 text-sm leading-relaxed line-clamp-2 mb-5 max-w-lg hidden sm:block">
            {item.overview}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2.5">
            <Link to={`/${type}/${item.id}`}>
              <Button size="lg" className="bg-white text-black hover:bg-white/92 shadow-none font-bold gap-2 rounded-xl">
                <Play className="h-4 w-4 fill-black" />
                View Details
              </Button>
            </Link>
            {user && (
              <Button variant="glass" size="lg" onClick={toggleWl} disabled={wlLoading} className="gap-2 font-semibold">
                {inWl
                  ? <BookmarkCheck className="h-4 w-4 text-primary" />
                  : <Bookmark className="h-4 w-4" />
                }
                {inWl ? 'Saved' : 'Watchlist'}
              </Button>
            )}
            <Link to={`/${type}/${item.id}`}>
              <Button variant="glass" size="lg" className="gap-2 font-semibold">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">More Info</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Hero Skeleton ── */
function HeroSkeleton() {
  return (
    <div className="relative h-[92vh] min-h-[600px] bg-black overflow-hidden">
      <div className="absolute inset-0 shimmer opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute bottom-24 left-4 sm:left-10 space-y-4 max-w-lg">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-14 w-72 md:w-[420px] rounded-2xl" />
        <Skeleton className="h-4 w-40 rounded-lg" />
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
  const { user } = useAuthStore()
  const { recommended } = usePersonalization(user?.id)
  const [featured,       setFeatured]       = useState([])
  const [heroIdx,        setHeroIdx]        = useState(0)
  const [sections,       setSections]       = useState([])
  const [sectionMedia,   setSectionMedia]   = useState({})
  const [trendingMovies, setTrendingMovies] = useState([])
  const [trendingSeries, setTrendingSeries] = useState([])
  const [hiddenGems,     setHiddenGems]     = useState([])
  const [topRated,       setTopRated]       = useState([])
  const [underrated,     setUnderrated]     = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [loading,        setLoading]        = useState(true)
  const autoRef = useRef(null)

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    const rv = getRecentlyViewed()
    if (rv.length) setRecentlyViewed(rv)
  }, [])

  async function loadData() {
    try {
      const [movies, series, sects, gems, top, under] = await Promise.all([
        movieService.getTrending(8),
        seriesService.getTrending(8),
        sectionService.getActiveSections(),
        supabase.from('movies')
          .select('id,title,poster,vote_average,release_date,genres,popularity')
          .gte('vote_average', 7.5).lte('popularity', 30)
          .order('vote_average', { ascending: false }).limit(10),
        supabase.from('movies')
          .select('id,title,poster,vote_average,release_date,genres')
          .gte('vote_average', 8.0)
          .order('vote_average', { ascending: false }).limit(12),
        supabase.from('movies')
          .select('id,title,poster,vote_average,release_date,genres,vote_count')
          .gte('vote_average', 7.0).lte('vote_count', 500)
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
      setTopRated((top.data || []).map(m => ({ ...m, _type: 'movie' })))
      setUnderrated((under.data || []).map(m => ({ ...m, _type: 'movie' })))
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
    <div className="bg-black min-h-screen">
      {/* ── Hero ── */}
      <div className="relative h-[92vh] min-h-[600px] overflow-hidden">
        {loading ? <HeroSkeleton /> : (
          <>
            {featured.map((item, i) => (
              <HeroSlide key={`${item._type}-${item.id}`} item={item} type={item._type} active={i === heroIdx} />
            ))}

            {/* Dot indicators */}
            {featured.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
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
      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10 mb-10 md:mb-12">
        <div className="bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-card-xl">
          <SearchBar className="w-full" />
        </div>
      </div>

      {/* ── Content rows ── */}
      <div className="pb-10 md:pb-16">
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
            {topRated.length > 0 && (
              <Top10List items={topRated} type="movie" title="Top 10 Movies" />
            )}
            {hiddenGems.length > 0 && (
              <MediaRow
                title={<span className="flex items-center gap-2"><Gem className="h-5 w-5 text-amber-500" />Hidden Gems</span>}
                items={hiddenGems} type="movie"
              />
            )}
            {underrated.length > 0 && (
              <MediaRow
                title={<span className="flex items-center gap-2"><ThumbsUp className="h-5 w-5 text-emerald-500" />Underrated Picks</span>}
                items={underrated} type="movie"
              />
            )}
            {recentlyViewed.length > 0 && (
              <MediaRow
                title={<span className="flex items-center gap-2"><Clock className="h-5 w-5 text-sky-400" />Recently Viewed</span>}
                items={recentlyViewed}
              />
            )}
            {recommended.length > 0 && (
              <MediaRow
                title={<span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Recommended for You</span>}
                items={recommended} type="movie"
              />
            )}

            {!loading && trendingMovies.length === 0 && trendingSeries.length === 0 && sections.length === 0 && (
              <div className="text-center py-28 px-4">
                <div className="text-7xl mb-5">🎬</div>
                <h2 className="text-2xl font-bold text-white mb-2">No content yet</h2>
                <p className="text-white/50 mb-7 max-w-sm mx-auto">Import movies and series from the admin panel to get started.</p>
                <Link to="/admin/import"><Button size="lg">Go to Admin Import</Button></Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
