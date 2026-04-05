import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, MapPin, Star, Film, Tv } from 'lucide-react'
import { personService } from '../services/persons'
import { supabase } from '../services/supabase'
import { Skeleton, Badge } from '../components/ui'
import { formatDate, cn } from '../utils/helpers'

export default function PersonDetailPage() {
  const { id } = useParams()
  const [person, setPerson] = useState(null)
  const [credits, setCredits] = useState([])
  const [mediaMap, setMediaMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [showFullBio, setShowFullBio] = useState(false)
  const [activeTab, setActiveTab] = useState('acting')

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

      const movieIds = creditsData.filter(c => c.media_type === 'movie').map(c => c.media_id)
      const seriesIds = creditsData.filter(c => c.media_type === 'series').map(c => c.media_id)

      const [movies, series] = await Promise.all([
        movieIds.length > 0 ? supabase.from('movies').select('id,title,poster,release_date,vote_average').in('id', movieIds) : { data: [] },
        seriesIds.length > 0 ? supabase.from('series').select('id,name,poster,first_air_date,vote_average').in('id', seriesIds) : { data: [] },
      ])

      const map = {}
      ;(movies.data || []).forEach(m => { map[`movie-${m.id}`] = { ...m, _type: 'movie', _title: m.title, _date: m.release_date } })
      ;(series.data || []).forEach(s => { map[`series-${s.id}`] = { ...s, _type: 'series', _title: s.name, _date: s.first_air_date } })
      setMediaMap(map)
    } finally { setLoading(false) }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        <Skeleton className="w-48 h-72 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )

  if (!person) return <div className="text-center py-20 text-muted-foreground">Person not found</div>

  const actingCredits = credits.filter(c => c.role === 'cast')
  const crewCredits = credits.filter(c => c.role === 'crew')
  const knownFor = actingCredits
    .slice(0, 8)
    .map(c => mediaMap[`${c.media_type}-${c.media_id}`])
    .filter(Boolean)

  const age = person.birthday
    ? Math.floor((new Date() - new Date(person.birthday)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="page-enter">
      {/* Cinematic Header */}
      <div className="relative bg-gradient-to-b from-muted/40 to-background border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="relative">
                {person.profile_image ? (
                  <img
                    src={person.profile_image}
                    alt={person.name}
                    className="w-44 h-64 object-cover rounded-2xl shadow-card-xl ring-2 ring-border/40"
                  />
                ) : (
                  <div className="w-44 h-64 rounded-2xl bg-muted flex items-center justify-center text-5xl font-black text-muted-foreground shadow-card-xl">
                    {person.name?.[0]}
                  </div>
                )}
                {person.known_for_department && (
                  <Badge variant="glass" className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-card">
                    {person.known_for_department}
                  </Badge>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pt-2">
              <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight">{person.name}</h1>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-5">
                {person.birthday && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(person.birthday)}
                    {age && <span className="text-foreground font-medium">({age} yrs)</span>}
                  </span>
                )}
                {person.place_of_birth && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {person.place_of_birth}
                  </span>
                )}
              </div>

              <div className="flex gap-4 mb-6 text-sm">
                <div className="text-center">
                  <div className="text-xl font-black text-foreground">{actingCredits.length}</div>
                  <div className="text-muted-foreground text-xs">Acting</div>
                </div>
                {crewCredits.length > 0 && (
                  <div className="text-center">
                    <div className="text-xl font-black text-foreground">{crewCredits.length}</div>
                    <div className="text-muted-foreground text-xs">Crew</div>
                  </div>
                )}
              </div>

              {person.biography && (
                <div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {showFullBio ? person.biography : person.biography.slice(0, 350) + (person.biography.length > 350 ? '…' : '')}
                  </p>
                  {person.biography.length > 350 && (
                    <button onClick={() => setShowFullBio(v => !v)} className="text-primary text-sm mt-2 hover:underline">
                      {showFullBio ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
        {/* Known For */}
        {knownFor.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-5">Known For</h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x-mandatory">
              {knownFor.map(media => (
                <Link key={`${media._type}-${media.id}`} to={`/${media._type}/${media.id}`}
                  className="flex-shrink-0 w-32 group snap-start">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted mb-2 ring-1 ring-border/40 group-hover:ring-primary/40 transition-all duration-200">
                    {media.poster
                      ? <img src={media.poster} alt={media._title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-xs text-center p-2 text-muted-foreground">{media._title}</div>
                    }
                  </div>
                  <div className="text-xs font-semibold line-clamp-2 group-hover:text-primary transition-colors">{media._title}</div>
                  {media.vote_average > 0 && (
                    <div className="flex items-center gap-1 mt-0.5 text-amber-400">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      <span className="text-[10px]">{media.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filmography Tabs */}
        {(actingCredits.length > 0 || crewCredits.length > 0) && (
          <section>
            <div className="flex items-center gap-1 border-b border-border/60 mb-6">
              {actingCredits.length > 0 && (
                <button onClick={() => setActiveTab('acting')}
                  className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200',
                    activeTab === 'acting' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                  <Film className="h-4 w-4" /> Acting
                  <span className="text-xs opacity-60">({actingCredits.length})</span>
                </button>
              )}
              {crewCredits.length > 0 && (
                <button onClick={() => setActiveTab('crew')}
                  className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200',
                    activeTab === 'crew' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                  <Tv className="h-4 w-4" /> Crew
                  <span className="text-xs opacity-60">({crewCredits.length})</span>
                </button>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
              {(activeTab === 'acting' ? actingCredits : crewCredits).map(credit => {
                const media = mediaMap[`${credit.media_type}-${credit.media_id}`]
                if (!media) return null
                return (
                  <Link key={credit.id} to={`/${credit.media_type}/${credit.media_id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0 group">
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {media.poster
                        ? <img src={media.poster} alt={media._title} loading="lazy" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">{media._title?.[0]}</div>
                      }
                    </div>
                    <span className="text-sm text-muted-foreground w-12 flex-shrink-0 font-medium">{media._date?.slice(0, 4) || '—'}</span>
                    <span className="font-semibold text-sm flex-1 group-hover:text-primary transition-colors">{media._title}</span>
                    {credit.character && <span className="text-sm text-muted-foreground hidden sm:block">as {credit.character}</span>}
                    {credit.job && <span className="text-sm text-muted-foreground hidden sm:block">{credit.job}</span>}
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
