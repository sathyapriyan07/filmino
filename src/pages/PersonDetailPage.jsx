import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, MapPin, Star, Film, Tv } from 'lucide-react'
import { personService } from '../services/persons'
import { supabase } from '../services/supabase'
import { Skeleton } from '../components/ui'
import { formatDate, cn } from '../utils/helpers'

export default function PersonDetailPage() {
  const { id } = useParams()
  const [person,       setPerson]       = useState(null)
  const [credits,      setCredits]      = useState([])
  const [mediaMap,     setMediaMap]     = useState({})
  const [loading,      setLoading]      = useState(true)
  const [showFullBio,  setShowFullBio]  = useState(false)
  const [activeTab,    setActiveTab]    = useState('acting')

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const [personData, creditsData] = await Promise.all([
        personService.getById(id),
        personService.getCredits(id),
      ])
      setPerson(personData)
      setCredits(creditsData || [])

      const movieIds  = creditsData.filter(c => c.media_type === 'movie').map(c => c.media_id)
      const seriesIds = creditsData.filter(c => c.media_type === 'series').map(c => c.media_id)
      const [movies, series] = await Promise.all([
        movieIds.length  > 0 ? supabase.from('movies').select('id,title,poster,release_date,vote_average').in('id', movieIds)  : { data: [] },
        seriesIds.length > 0 ? supabase.from('series').select('id,name,poster,first_air_date,vote_average').in('id', seriesIds) : { data: [] },
      ])
      const map = {}
      ;(movies.data || []).forEach(m => { map[`movie-${m.id}`]  = { ...m, _type: 'movie',  _title: m.title, _date: m.release_date } })
      ;(series.data || []).forEach(s => { map[`series-${s.id}`] = { ...s, _type: 'series', _title: s.name,  _date: s.first_air_date } })
      setMediaMap(map)
    } finally { setLoading(false) }
  }

  if (loading) return (
    <div className="bg-[#0B0B0F] min-h-screen">
      <div className="ott-container py-12 flex gap-8">
        <Skeleton className="w-44 h-64 rounded-2xl flex-shrink-0 bg-white/5" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-1/2 bg-white/5 rounded-xl" />
          <Skeleton className="h-4 w-full bg-white/5 rounded-lg" />
          <Skeleton className="h-4 w-3/4 bg-white/5 rounded-lg" />
        </div>
      </div>
    </div>
  )

  if (!person) return (
    <div className="bg-[#0B0B0F] min-h-screen flex items-center justify-center">
      <p className="text-white/40">Person not found</p>
    </div>
  )

  const actingCredits = credits.filter(c => c.role === 'cast')
  const crewCredits   = credits.filter(c => c.role === 'crew')
  const knownFor = actingCredits.slice(0, 8).map(c => mediaMap[`${c.media_type}-${c.media_id}`]).filter(Boolean)
  const age = person.birthday
    ? Math.floor((new Date() - new Date(person.birthday)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="bg-[#0B0B0F] min-h-screen page-enter">
      <div className="ott-container py-10 md:py-14">

        {/* ── Profile header ── */}
        <div className="flex flex-col sm:flex-row gap-8 items-start mb-12 md:mb-16">

          {/* Photo */}
          <div className="flex-shrink-0">
            {person.profile_image ? (
              <img
                src={person.profile_image}
                alt={person.name}
                className="w-40 md:w-48 aspect-[2/3] object-cover rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.7)] border border-white/10"
              />
            ) : (
              <div className="w-40 md:w-48 aspect-[2/3] rounded-2xl bg-white/5 flex items-center justify-center text-5xl font-black text-white/20">
                {person.name?.[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-1">
            {person.known_for_department && (
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mb-3 block">
                {person.known_for_department}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight text-cinematic mb-4">
              {person.name}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-white/40 mb-6">
              {person.birthday && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(person.birthday)}
                  {age && <span className="text-white/60 font-medium">({age} yrs)</span>}
                </span>
              )}
              {person.place_of_birth && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {person.place_of_birth}
                </span>
              )}
            </div>

            {/* Credit counts */}
            <div className="flex gap-6 mb-6">
              <div>
                <span className="text-2xl font-black text-white">{actingCredits.length}</span>
                <span className="text-white/35 text-sm ml-1.5">Acting</span>
              </div>
              {crewCredits.length > 0 && (
                <div>
                  <span className="text-2xl font-black text-white">{crewCredits.length}</span>
                  <span className="text-white/35 text-sm ml-1.5">Crew</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {person.biography && (
              <div>
                <p className="text-white/50 text-sm leading-relaxed">
                  {showFullBio ? person.biography : person.biography.slice(0, 320) + (person.biography.length > 320 ? '…' : '')}
                </p>
                {person.biography.length > 320 && (
                  <button onClick={() => setShowFullBio(v => !v)}
                    className="text-indigo-400 text-sm mt-2 hover:text-indigo-300 transition-colors font-medium">
                    {showFullBio ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Known For ── */}
        {knownFor.length > 0 && (
          <section className="mb-12">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-5">Known For</p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {knownFor.map(media => (
                <Link key={`${media._type}-${media.id}`} to={`/${media._type}/${media.id}`}
                  className="flex-shrink-0 w-[120px] group">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-2 transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-[0_8px_32px_rgba(99,102,241,0.35)]">
                    {media.poster
                      ? <img src={media.poster} alt={media._title} loading="lazy" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xs text-center p-2 text-white/20">{media._title}</div>
                    }
                  </div>
                  <p className="text-[12px] font-medium text-white/70 line-clamp-2 group-hover:text-indigo-400 transition-colors leading-tight">{media._title}</p>
                  {media.vote_average > 0 && (
                    <div className="flex items-center gap-1 mt-0.5 text-amber-400">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      <span className="text-[10px] font-semibold">{media.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Filmography ── */}
        {(actingCredits.length > 0 || crewCredits.length > 0) && (
          <section>
            <div className="flex gap-6 border-b border-white/8 mb-6">
              {actingCredits.length > 0 && (
                <button onClick={() => setActiveTab('acting')}
                  className={cn('ott-tab flex items-center gap-2', activeTab === 'acting' ? 'ott-tab-active' : 'ott-tab-inactive')}>
                  <Film className="h-3.5 w-3.5" />
                  Acting
                  <span className="text-[11px] opacity-40">({actingCredits.length})</span>
                </button>
              )}
              {crewCredits.length > 0 && (
                <button onClick={() => setActiveTab('crew')}
                  className={cn('ott-tab flex items-center gap-2', activeTab === 'crew' ? 'ott-tab-active' : 'ott-tab-inactive')}>
                  <Tv className="h-3.5 w-3.5" />
                  Crew
                  <span className="text-[11px] opacity-40">({crewCredits.length})</span>
                </button>
              )}
            </div>

            <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden animate-fade-in">
              {(activeTab === 'acting' ? actingCredits : crewCredits).map(credit => {
                const media = mediaMap[`${credit.media_type}-${credit.media_id}`]
                if (!media) return null
                return (
                  <Link key={credit.id} to={`/${credit.media_type}/${credit.media_id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.05] last:border-0 group">
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      {media.poster
                        ? <img src={media.poster} alt={media._title} loading="lazy" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs text-white/20">{media._title?.[0]}</div>
                      }
                    </div>
                    <span className="text-sm text-white/25 w-10 flex-shrink-0 font-medium tabular-nums">{media._date?.slice(0, 4) || '—'}</span>
                    <span className="font-semibold text-sm text-white/80 flex-1 group-hover:text-white transition-colors">{media._title}</span>
                    {credit.character && <span className="text-sm text-white/30 hidden sm:block">as {credit.character}</span>}
                    {credit.job       && <span className="text-sm text-white/30 hidden sm:block">{credit.job}</span>}
                    {media.vote_average > 0 && (
                      <span className="flex items-center gap-1 text-amber-400 text-xs flex-shrink-0">
                        <Star className="h-3 w-3 fill-current" />{media.vote_average.toFixed(1)}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
