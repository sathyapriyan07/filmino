import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Tv, Film, Star, Gem, Clock, Sparkles, ThumbsUp, Clapperboard
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

export default function HomePage() {
  const { user } = useAuthStore()
  const { recommended } = usePersonalization(user?.id)

  const [loading,        setLoading]        = useState(true)
  const [heroItems,      setHeroItems]      = useState([])
  const [trendMovies,    setTrendMovies]    = useState([])
  const [trendSeries,    setTrendSeries]    = useState([])
  const [topRated,       setTopRated]       = useState([])
  const [hiddenGems,     setHiddenGems]     = useState([])
  const [underrated,     setUnderrated]     = useState([])
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
      const [movies, series, sects, gems, top, under] = await Promise.all([
        movieService.getTrending(8),
        seriesService.getTrending(8),
        sectionService.getActiveSections(),
        supabase.from('movies')
          .select('id,title,poster,backdrop,vote_average,release_date,genres,popularity')
          .gte('vote_average', 7.5).lte('popularity', 30)
          .order('vote_average', { ascending: false }).limit(10),
        supabase.from('movies')
          .select('id,title,poster,backdrop,vote_average,release_date,genres')
          .gte('vote_average', 8.0)
          .order('vote_average', { ascending: false }).limit(12),
        supabase.from('movies')
          .select('id,title,poster,backdrop,vote_average,release_date,genres,vote_count')
          .gte('vote_average', 7.0).lte('vote_count', 500)
          .order('vote_average', { ascending: false }).limit(10),
      ])

      const hero = [
        ...movies.filter(m => m.backdrop).slice(0, 4).map(m => ({ ...m, _type: 'movie' })),
        ...series.filter(s => s.backdrop).slice(0, 2).map(s => ({ ...s, _type: 'series' })),
      ]

      setHeroItems(hero)
      setTrendMovies(movies.map(m => ({ ...m, _type: 'movie' })))
      setTrendSeries(series.map(s => ({ ...s, _type: 'series' })))
      setTopRated((top.data || []).map(m => ({ ...m, _type: 'movie' })))
      setHiddenGems((gems.data || []).map(m => ({ ...m, _type: 'movie' })))
      setUnderrated((under.data || []).map(m => ({ ...m, _type: 'movie' })))
      setSections(sects)

      // Resolve section items
      const mediaMap = {}
      for (const sec of sects) {
        const items = sec.section_items || []
        const mIds = items.filter(i => i.media_type === 'movie').map(i => i.media_id)
        const sIds = items.filter(i => i.media_type === 'series').map(i => i.media_id)
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

  const isEmpty = !loading && !trendMovies.length && !trendSeries.length && !sections.length

  return (
    <div className="min-h-screen bg-[#0B0B0F]">

      {/* ── Hero ── */}
      <HeroBanner items={heroItems} loading={loading} />

      {/* ── Content feed ── */}
      <div className="pt-6 pb-24 md:pb-10">

        {/* Admin-defined sections */}
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

        {/* Underrated */}
        {underrated.length > 0 && (
          <MovieRow
            title="Underrated Picks"
            icon={<ThumbsUp className="h-4 w-4 text-sky-400" />}
            items={underrated}
            type="movie"
          />
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <MovieRow
            title="Recently Viewed"
            icon={<Clock className="h-4 w-4 text-rose-400" />}
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
          <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
              <Clapperboard className="h-8 w-8 text-white/20" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No content yet</h2>
            <p className="text-white/40 text-sm mb-6 max-w-xs">
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
