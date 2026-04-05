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

function HeroSlide({ item, type, active }) {
  const title = type === 'movie' ? item.title : item.name
  const date = type === 'movie' ? item.release_date : item.first_air_date
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
      else { await watchlistService.add(user.id, item.id, type); setInWl(true) }
    } finally { setWlLoading(false) }
  }

  return (
    <div className={cn('absolute inset-0 transition-opacity duration-700', active ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
      {/* Backdrop */}
      <div className="absolute inset-0">
        <img
          src={item.backdrop || item.poster}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-end">
        <div className="max-w-7xl mx-auto px-4 pb-16 md:pb-20 w-full">
          <div className="max-w-2xl">
            {/* Type badge */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="glass" className="gap-1.5">
                {type === 'movie' ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
                {type === 'movie' ? 'Movie' : 'Series'}
              </Badge>
              {genres.slice(0, 2).map(g => (
                <Badge key={g} variant="glass">{g}</Badge>
              ))}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-3 leading-[1.05] tracking-tight">
              {title}
            </h1>

            <div className="flex items-center gap-4 text-white/70 text-sm mb-4">
              {item.vote_average > 0 && (
                <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                  <Star className="h-4 w-4 fill-current" />
                  {item.vote_average?.toFixed(1)}
                  <span className="text-white/40 font-normal text-xs">/ 10</span>
                </span>
              )}
              <span className="text-white/50">·</span>
              <span>{formatYear(date)}</span>
            </div>

            <p className="text-white/75 text-sm md:text-base leading-relaxed line-clamp-3 mb-7 max-w-xl">
              {item.overview}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to={`/${type}/${item.id}`}>
                <Button size="lg" className="gap-2.5 bg-white text-black hover:bg-white/90 shadow-none font-bold">
                  <Play className="h-4 w-4 fill-black" /> View Details
                </Button>
              </Link>
              {user && (
                <Button
                  variant="glass"
                  size="lg"
                  onClick={toggleWl}
                  disabled={wlLoading}
                  className="gap-2.5 font-semibold"
                >
                  {inWl ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
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

function HeroSkeleton() {
  return (
    <div className="relative h-[75vh] min-h-[520px] bg-muted">
      <div className="absolute inset-0 shimmer" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      <div className="absolute bottom-16 left-4 md:left-8 space-y-4 max-w-lg">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-14 w-96 rounded-2xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="flex gap-3">
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [heroIdx, setHeroIdx] = useState(0)
  const [sections, setSections] = useState([])
  const [sectionMedia, setSectionMedia] = useState({})
  const [trendingMovies, setTrendingMovies] = useState([])
  const [trendingSeries, setTrendingSeries] = useState([])
  const [hiddenGems, setHiddenGems] = useState([])
  const [loading, setLoading] = useState(true)
  const autoRef = useRef(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [movies, series, sects, gems] = await Promise.all([
        movieService.getTrending(8),
        seriesService.getTrending(8),
        sectionService.getActiveSections(),
        // Hidden gems: high rating, lower popularity
        supabase.from('movies')
          .select('id,title,poster,vote_average,release_date,genres,popularity')
          .gte('vote_average', 7.5)
          .lte('popularity', 30)
          .order('vote_average', { ascending: false })
          .limit(10),
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

      // Load section media
      const mediaMap = {}
      for (const section of sects) {
        const items = section.section_items || []
        const movieIds = items.filter(i => i.media_type === 'movie').map(i => i.media_id)
        const seriesIds = items.filter(i => i.media_type === 'series').map(i => i.media_id)
        const [md, sd] = await Promise.all([
          movieIds.length > 0 ? supabase.from('movies').select('id,title,poster,vote_average,release_date,genres').in('id', movieIds) : { data: [] },
          seriesIds.length > 0 ? supabase.from('series').select('id,name,poster,vote_average,first_air_date,genres').in('id', seriesIds) : { data: [] },
        ])
        const ordered = items
          .map(i => {
            const found = i.media_type === 'movie'
              ? (md.data || []).find(m => m.id === i.media_id)
              : (sd.data || []).find(s => s.id === i.media_id)
            return found ? { ...found, _type: i.media_type } : null
          })
          .filter(Boolean)
        mediaMap[section.id] = ordered
      }
      setSectionMedia(mediaMap)
    } finally {
      setLoading(false)
    }
  }

  // Auto-advance hero
  useEffect(() => {
    if (featured.length < 2) return
    autoRef.current = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 7000)
    return () => clearInterval(autoRef.current)
  }, [featured.length])

  const goHero = (idx) => {
    clearInterval(autoRef.current)
    setHeroIdx(idx)
  }

  const hero = featured[heroIdx]

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative h-[75vh] min-h-[520px] overflow-hidden">
        {loading ? <HeroSkeleton /> : (
          <>
            {featured.map((item, i) => (
              <HeroSlide key={`${item._type}-${item.id}`} item={item} type={item._type} active={i === heroIdx} />
            ))}

            {/* Dot nav */}
            {featured.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                <button onClick={() => goHero((heroIdx - 1 + featured.length) % featured.length)}
                  className="p-1.5 rounded-full bg-white/15 backdrop-blur hover:bg-white/30 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-white" />
                </button>
                <div className="flex gap-1.5">
                  {featured.map((_, i) => (
                    <button key={i} onClick={() => goHero(i)}
                      className={cn('rounded-full transition-all duration-300', i === heroIdx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60')} />
                  ))}
                </div>
                <button onClick={() => goHero((heroIdx + 1) % featured.length)}
                  className="p-1.5 rounded-full bg-white/15 backdrop-blur hover:bg-white/30 transition-colors">
                  <ChevronRight className="h-4 w-4 text-white" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Floating Search ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-7 relative z-10 mb-12">
        <div className="bg-card/90 backdrop-blur-2xl border border-border/80 rounded-2xl p-3 shadow-card-hover">
          <SearchBar className="w-full" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <>
            <MediaRow title="Trending Movies" loading />
            <MediaRow title="Popular Series" loading />
          </>
        ) : (
          <>
            {/* Admin sections first */}
            {sections.map(section => {
              const items = sectionMedia[section.id] || []
              if (!items.length) return null
              return (
                <MediaRow
                  key={section.id}
                  title={section.title}
                  items={items}
                  type={section.type === 'series' ? 'series' : 'movie'}
                />
              )
            })}

            {/* Trending Movies */}
            {trendingMovies.length > 0 && (
              <MediaRow
                title={<span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Trending Movies</span>}
                items={trendingMovies}
                type="movie"
                viewAllHref="/movies"
              />
            )}

            {/* Trending Series */}
            {trendingSeries.length > 0 && (
              <MediaRow
                title={<span className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-purple-500" /> Popular Series</span>}
                items={trendingSeries}
                type="series"
                viewAllHref="/series"
              />
            )}

            {/* Hidden Gems */}
            {hiddenGems.length > 0 && (
              <MediaRow
                title={<span className="flex items-center gap-2"><Gem className="h-5 w-5 text-yellow-500" /> Hidden Gems</span>}
                items={hiddenGems}
                type="movie"
              />
            )}

            {/* Empty state */}
            {!loading && trendingMovies.length === 0 && trendingSeries.length === 0 && sections.length === 0 && (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">🎬</div>
                <h2 className="text-2xl font-bold mb-2">No content yet</h2>
                <p className="text-muted-foreground mb-6">Import movies and series from the admin panel to get started.</p>
                <Link to="/admin/import">
                  <Button>Go to Admin Import</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
