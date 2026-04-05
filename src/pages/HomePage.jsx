import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { movieService, seriesService } from '../services/media'
import { sectionService } from '../services/admin'
import { supabase } from '../services/supabase'
import MediaRow from '../components/MediaRow'
import SearchBar from '../components/SearchBar'
import { Skeleton } from '../components/ui'
import { formatYear, getGenreNames } from '../utils/helpers'

function HeroSlide({ item, type }) {
  const title = type === 'movie' ? item.title : item.name
  const date = type === 'movie' ? item.release_date : item.first_air_date
  const genres = getGenreNames(item.genres)

  return (
    <div className="relative h-[70vh] min-h-[500px] flex items-end">
      <div className="absolute inset-0">
        <img src={item.backdrop || item.poster} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-16 w-full">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            {genres.slice(0, 3).map(g => (
              <span key={g} className="text-xs bg-white/20 backdrop-blur text-white px-2 py-0.5 rounded-full">{g}</span>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">{title}</h1>
          <div className="flex items-center gap-3 text-white/70 text-sm mb-4">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              {item.vote_average?.toFixed(1)}
            </span>
            <span>{formatYear(date)}</span>
          </div>
          <p className="text-white/80 text-sm line-clamp-3 mb-6">{item.overview}</p>
          <div className="flex gap-3">
            <Link to={`/${type}/${item.id}`}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-semibold hover:bg-white/90 transition-colors">
              <Play className="h-4 w-4 fill-current" /> View Details
            </Link>
          </div>
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [movies, series, sects] = await Promise.all([
        movieService.getTrending(5),
        seriesService.getTrending(5),
        sectionService.getActiveSections(),
      ])

      const heroItems = [
        ...movies.slice(0, 3).map(m => ({ ...m, _type: 'movie' })),
        ...series.slice(0, 2).map(s => ({ ...s, _type: 'series' })),
      ]
      setFeatured(heroItems)
      setSections(sects)

      // Load section media
      const mediaMap = {}
      for (const section of sects) {
        const items = section.section_items || []
        const movieIds = items.filter(i => i.media_type === 'movie').map(i => i.media_id)
        const seriesIds = items.filter(i => i.media_type === 'series').map(i => i.media_id)

        const [moviesData, seriesData] = await Promise.all([
          movieIds.length > 0
            ? supabase.from('movies').select('id,title,poster,vote_average,release_date,genres').in('id', movieIds)
            : { data: [] },
          seriesIds.length > 0
            ? supabase.from('series').select('id,name,poster,vote_average,first_air_date,genres').in('id', seriesIds)
            : { data: [] },
        ])

        const combined = [
          ...(moviesData.data || []).map(m => ({ ...m, _type: 'movie' })),
          ...(seriesData.data || []).map(s => ({ ...s, _type: 'series' })),
        ]
        mediaMap[section.id] = combined
      }
      setSectionMedia(mediaMap)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (featured.length < 2) return
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 6000)
    return () => clearInterval(timer)
  }, [featured.length])

  const hero = featured[heroIdx]

  return (
    <div>
      {/* Hero */}
      <div className="relative">
        {loading ? (
          <Skeleton className="h-[70vh] min-h-[500px] w-full rounded-none" />
        ) : hero ? (
          <HeroSlide item={hero} type={hero._type} />
        ) : null}

        {featured.length > 1 && (
          <div className="absolute bottom-6 right-6 flex items-center gap-2 z-20">
            <button onClick={() => setHeroIdx(i => (i - 1 + featured.length) % featured.length)}
              className="p-1.5 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors">
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <div className="flex gap-1">
              {featured.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === heroIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
            <button onClick={() => setHeroIdx(i => (i + 1) % featured.length)}
              className="p-1.5 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors">
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Search hero */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10 mb-10">
        <div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-4 shadow-xl">
          <SearchBar className="w-full" />
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <>
            <MediaRow title="Trending Movies" loading />
            <MediaRow title="Popular Series" loading />
          </>
        ) : (
          <>
            {sections.map(section => {
              const items = sectionMedia[section.id] || []
              if (items.length === 0) return null
              const type = section.type === 'series' ? 'series' : 'movie'
              return (
                <MediaRow
                  key={section.id}
                  title={section.title}
                  items={items}
                  type={type}
                />
              )
            })}
            {sections.length === 0 && (
              <>
                <MediaRow title="Trending Movies" items={featured.filter(f => f._type === 'movie')} type="movie" />
                <MediaRow title="Popular Series" items={featured.filter(f => f._type === 'series')} type="series" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
