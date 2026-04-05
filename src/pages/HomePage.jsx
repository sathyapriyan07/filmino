import { useState, useEffect } from 'react'
import { Flame, TrendingUp, Star, Tv, Sparkles, Clock, Heart } from 'lucide-react'
import { movieService, seriesService } from '../services/media'
import { sectionService } from '../services/admin'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store/authStore'
import { usePersonalization } from '../hooks/usePersonalization'
import { getRecentlyViewed } from '../hooks/useRecentlyViewed'
import HeroBanner from '../components/HeroBanner'
import MovieRow from '../components/MovieRow'

async function fetchNowPlaying() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const { data } = await supabase
    .from('movies')
    .select('id,title,poster,backdrop,vote_average,release_date,genres,popularity,overview')
    .gte('release_date', cutoff.toISOString().slice(0, 10))
    .order('popularity', { ascending: false })
    .limit(12)
  return (data || []).map(m => ({ ...m, _type: 'movie' }))
}

async function fetchPopular() {
  const { data } = await supabase
    .from('movies')
    .select('id,title,poster,backdrop,vote_average,release_date,genres,popularity,overview')
    .gte('popularity', 20)
    .order('popularity', { ascending: false })
    .limit(16)
  return (data || []).map(m => ({ ...m, _type: 'movie' }))
}

async function fetchTopRated() {
  const { data } = await supabase
    .from('movies')
    .select('id,title,poster,backdrop,vote_average,release_date,genres,overview')
    .gte('vote_average', 8.0)
    .order('vote_average', { ascending: false })
    .limit(14)
  return (data || []).map(m => ({ ...m, _type: 'movie' }))
}

async function fetchHiddenGems() {
  const { data } = await supabase
    .from('movies')
    .select('id,title,poster,backdrop,vote_average,release_date,genres,popularity,overview')
    .gte('vote_average', 7.5)
    .lte('popularity', 30)
    .order('vote_average', { ascending: false })
    .limit(12)
  return (data || []).map(m => ({ ...m, _type: 'movie' }))
}

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

      const tMovies = movies.map(m => ({ ...m, _type: 'movie' }))
      const tSeries = series.map(s => ({ ...s, _type: 'series' }))

      setTrendMovies(tMovies)
      setTrendSeries(tSeries)
      setPopular(pop)
      setTopRated(top)
      setNowPlaying(now)
      setHiddenGems(gems)
      setSections(sects)

      // Hero: pick top items with backdrops
      const heroPool = [...tMovies, ...tSeries]
        .filter(i => i.backdrop)
        .slice(0, 8)
      setHeroItems(heroPool)

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

  return (
    <div className="bg-[#0b0b0f] min-h-screen overflow-x-hidden">

      {/* ── Hero Banner ── */}
      <div className="-mt-16">
        <HeroBanner items={heroItems} loading={loading} />
      </div>

      {/* ── Content rows ── */}
      <div className="py-8 md:py-12 space-y-2">

        {/* Custom sections */}
        {sections.map(sec => (
          sectionMedia[sec.id]?.length > 0 && (
            <MovieRow
              key={sec.id}
              title={sec.title}
              items={sectionMedia[sec.id]}
              loading={false}
            />
          )
        ))}

        <MovieRow
          title="Now Playing"
          icon={<Flame className="h-4 w-4 text-orange-400" />}
          items={nowPlaying}
          loading={loading}
          viewAllHref="/movies"
        />

        <MovieRow
          title="Trending Movies"
          icon={<TrendingUp className="h-4 w-4 text-indigo-400" />}
          items={trendMovies}
          loading={loading}
          viewAllHref="/movies"
        />

        <MovieRow
          title="Trending Series"
          icon={<Tv className="h-4 w-4 text-violet-400" />}
          items={trendSeries}
          type="series"
          loading={loading}
          viewAllHref="/series"
        />

        <MovieRow
          title="Popular Right Now"
          icon={<Sparkles className="h-4 w-4 text-pink-400" />}
          items={popular}
          loading={loading}
          viewAllHref="/movies"
        />

        <MovieRow
          title="Top Rated"
          icon={<Star className="h-4 w-4 text-amber-400" />}
          items={topRated}
          loading={loading}
          viewAllHref="/movies"
        />

        <MovieRow
          title="Hidden Gems"
          icon={<Heart className="h-4 w-4 text-rose-400" />}
          items={hiddenGems}
          loading={loading}
        />

        {recentlyViewed.length > 0 && (
          <MovieRow
            title="Continue Watching"
            icon={<Clock className="h-4 w-4 text-emerald-400" />}
            items={recentlyViewed}
            loading={false}
          />
        )}

        {recommended?.length > 0 && (
          <MovieRow
            title="Recommended for You"
            icon={<Sparkles className="h-4 w-4 text-indigo-400" />}
            items={recommended}
            loading={false}
          />
        )}
      </div>
    </div>
  )
}
