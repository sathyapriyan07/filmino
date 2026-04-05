import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Tv, Star, Flame, Clock3,
  Gem, ThumbsUp, Sparkles, Clapperboard,
} from 'lucide-react'
import { movieService, seriesService } from '../services/media'
import { sectionService } from '../services/admin'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store/authStore'
import { usePersonalization } from '../hooks/usePersonalization'
import { getRecentlyViewed } from '../hooks/useRecentlyViewed'
import HeroBanner from '../components/HeroBanner'
import MovieRow from '../components/MovieRow'
import { Button } from '../components/ui'

/* ── Data fetching ── */
async function fetchNowPlaying() {
  // "Now Playing" = released in the last 90 days, sorted by popularity
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const { data } = await supabase
    .from('movies')
    .select('id,title,poster,backdrop,vote_average,release_date,genres,popularity')
    .gte('release_date', cutoff.toISOString().slice(0, 10))
    .order('popularity', { ascending: false })
    .limit(12)
  return (data || []).map(m => ({ ...m, _type: 'movie' }))
}

async function fetchPopular() {
  // "Popular" = high popularity score, any time
  const { data } = await supabase
    .from('movies')
    .select('id,title,poster,backdrop,vote_average,release_date,genres,popularity')
    .gte('popularity', 20)
    .order('popularity', { ascending: false })
    .limit(16)
  return (data || []).map(m => ({ ...m, _type: 'movie' }))
}

async function fetchTopRated() {
  const { data } = await supabase
    .from('movies')
    .select('id,title,poster,backdrop,vote_average,release_date,genres')
    .gte('vote_average', 8.0)
    .order('vote_average', { ascending: false })
    .limit(14)
  return (data || []).map(m => ({ ...m, _type: 'movie' }))
}

async function fetchHiddenGems() {
  const { data } = await supabase
    .from('movies')
    .select('id,title,poster,backdrop,vote_average,release_date,genres,popularity')
    .gte('vote_average', 7.5)
    .lte('popularity', 30)
    .order('vote_average', { ascending: false })
    .limit(12)
  return (data || []).map(m => ({ ...m, _type: 'movie' }))
}

/* ── Component ── */
export default function HomePage() {
  const { user } = useAuthStore()
  const { recommended } = usePersonalization(user?.id)

  const [loading,        setLoading]        = useState(true)
  const [heroItems,      setHeroItems]      = useState([])
  const [trendMovies,    setTrendMovies]    = useState([])
  const [trendSeries,    setTrendSeries]    = useState([])
  const [popular,        setPopular]        = useState([])
  const [topRated,       setTopRated]       = useState([])
  const [nowPlaying,     setNowPlaying]     = useState([])
  const [hiddenGems,     setHiddenGems]     = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [sections,       setSections]       = useState([])
  const [sectionMedia,   setSectionMedia]   = useState({})

  useEffect(() => {
    const rv = getRecentlyViewed()
    if (rv.length) setRecentlyViewed(rv)
  }, [])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [movies, series, sects, pop, top, now, gems] = await Promise.all([
        movieService.getTrending(10),
        seriesService.getTrending(10),
        sectionService.getActiveSections(),
        fetchPopular(),
        fetchTopRated(),
        fetchNowPlaying(),
        fetchHiddenGems(),
      ])

      // Hero: prefer items with a backdrop image
      const heroPool = [
        ...movies.filter(m => m.backdrop).slice(0, 4).map(m => ({ ...m, _type: 'movie' })),
        ...series.filter(s => s.backdrop).slice(0, 2).map(s => ({ ...s, _type: 'series' })),
      ]
      setHeroItems(heroPool)
      setTrendMovies(movies.map(m => ({ ...m, _type: 'movie' })))
      setTrendSeries(series.map(s => ({ ...s, _type: 'series' })))
      setPopular(pop)
      setTopRated(top)
      setNowPlaying(now)
      setHiddenGems(gems)
      setSections(sects)

      // Resolve admin-defined section items
      const mediaMap = {}
      for (const sec of sects) {
        const items = sec.section_items || []
        const mIds  = items.filter(i => i.media_type === 'movie').map(i => i.media_id)
        const sIds  = items.filter(i => i.media_type === 'series').map(i => i.media_id)
        const [md, sd] = await Promise.all([
          mIds.length ? supabase.from('movies').select('id,title,poster,backdrop,vote_average,release_date,genres').in('id', mIds) : { data: [] },
          sIds.length ? supabase.from('series').select('id,name,poster,backdrop,vote_average,first_air_date,genres').in('id', sIds) : { data: [] },
        ])
        mediaMap[sec.id] = items
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

  const isEmpty = !loading
    && !trendMovies.length
    && !trendSeries.length
    && !popular.length
    && !sections.length

  return (
    <div className="min-h-screen bg-[#0B0B0F]">

      {/* ── Hero Banner ── */}
      <HeroBanner items={heroItems} loading={loading} />

      {/* ── Content feed ── */}
      <div className="pt-8 pb-28 md:pb-12">

        {/* Admin-curated sections (highest priority) */}
        {sections.map(sec => {
          const items = sectionMedia[sec.id] || []
          if (!items.length) return null
          return (
            <MovieRow
              key={sec.id}
              title={sec.title}
              items={items}
              type={sec.type === 'series' ? 'series' : 'movie'}
            />
          )
        })}

        {/* Now Playing */}
        {(loading || nowPlaying.length > 0) && (
          <MovieRow
            title="Now Playing"
            icon={<Clock3 className="h-4 w-4 text-rose-400" />}
            items={nowPlaying}
            type="movie"
            loading={loading}
            viewAllHref="/movies"
          />
        )}

        {/* Trending Movies */}
        {(loading || trendMovies.length > 0) && (
          <MovieRow
            title="Trending Movies"
            icon={<TrendingUp className="h-4 w-4 text-indigo-400" />}
            items={trendMovies}
            type="movie"
            loading={loading}
            viewAllHref="/movies"
          />
        )}

        {/* Popular */}
        {(loading || popular.length > 0) && (
          <MovieRow
            title="Popular Right Now"
            icon={<Flame className="h-4 w-4 text-orange-400" />}
            items={popular}
            type="movie"
            loading={loading}
            viewAllHref="/movies"
          />
        )}

        {/* Trending Series */}
        {(loading || trendSeries.length > 0) && (
          <MovieRow
            title="Trending Series"
            icon={<Tv className="h-4 w-4 text-violet-400" />}
            items={trendSeries}
            type="series"
            loading={loading}
            viewAllHref="/series"
          />
        )}

        {/* Top Rated */}
        {topRated.length > 0 && (
          <MovieRow
            title="Top Rated"
            icon={<Star className="h-4 w-4 text-amber-400" />}
            items={topRated}
            type="movie"
            viewAllHref="/movies"
          />
        )}

        {/* Hidden Gems */}
        {hiddenGems.length > 0 && (
          <MovieRow
            title="Hidden Gems"
            icon={<Gem className="h-4 w-4 text-emerald-400" />}
            items={hiddenGems}
            type="movie"
          />
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <MovieRow
            title="Continue Watching"
            icon={<ThumbsUp className="h-4 w-4 text-sky-400" />}
            items={recentlyViewed}
          />
        )}

        {/* Recommended */}
        {recommended.length > 0 && (
          <MovieRow
            title="Recommended for You"
            icon={<Sparkles className="h-4 w-4 text-indigo-400" />}
            items={recommended}
            type="movie"
          />
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-36 px-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
              <Clapperboard className="h-8 w-8 text-white/15" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No content yet</h2>
            <p className="text-white/35 text-sm mb-7 max-w-xs leading-relaxed">
              Import movies and series from the admin panel to get started.
            </p>
            <Link to="/admin/import">
              <Button size="lg">Go to Admin Import</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
