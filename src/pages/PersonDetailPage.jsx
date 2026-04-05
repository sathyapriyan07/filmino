import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'
import { personService } from '../services/persons'
import { supabase } from '../services/supabase'
import { Skeleton } from '../components/ui'
import { formatDate } from '../utils/helpers'

export default function PersonDetailPage() {
  const { id } = useParams()
  const [person, setPerson] = useState(null)
  const [credits, setCredits] = useState([])
  const [mediaMap, setMediaMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [showFullBio, setShowFullBio] = useState(false)

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

      // Load media details
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
    } finally {
      setLoading(false)
    }
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
  const knownFor = actingCredits.slice(0, 6).map(c => mediaMap[`${c.media_type}-${c.media_id}`]).filter(Boolean)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        {/* Profile */}
        <div className="flex-shrink-0">
          {person.profile_image ? (
            <img src={person.profile_image} alt={person.name} className="w-48 h-72 object-cover rounded-2xl shadow-xl" />
          ) : (
            <div className="w-48 h-72 rounded-2xl bg-muted flex items-center justify-center text-4xl text-muted-foreground">
              {person.name?.[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{person.name}</h1>
          {person.known_for_department && (
            <p className="text-primary font-medium mb-4">{person.known_for_department}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            {person.birthday && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {formatDate(person.birthday)}
              </span>
            )}
            {person.place_of_birth && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {person.place_of_birth}
              </span>
            )}
          </div>
          {person.biography && (
            <div>
              <h2 className="font-semibold mb-2">Biography</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {showFullBio ? person.biography : person.biography.slice(0, 400) + (person.biography.length > 400 ? '...' : '')}
              </p>
              {person.biography.length > 400 && (
                <button onClick={() => setShowFullBio(!showFullBio)} className="text-primary text-sm mt-2 hover:underline">
                  {showFullBio ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Known For */}
      {knownFor.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Known For</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {knownFor.map(media => (
              <Link key={`${media._type}-${media.id}`} to={`/${media._type}/${media.id}`}
                className="flex-shrink-0 w-32 group">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted mb-2">
                  {media.poster
                    ? <img src={media.poster} alt={media._title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    : <div className="w-full h-full flex items-center justify-center text-xs text-center p-2 text-muted-foreground">{media._title}</div>
                  }
                </div>
                <div className="text-xs font-medium line-clamp-2">{media._title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Filmography */}
      {actingCredits.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Acting</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {actingCredits.map(credit => {
              const media = mediaMap[`${credit.media_type}-${credit.media_id}`]
              if (!media) return null
              return (
                <Link key={credit.id} to={`/${credit.media_type}/${credit.media_id}`}
                  className="flex items-center gap-4 p-3 hover:bg-accent transition-colors border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground w-12 flex-shrink-0">{media._date?.slice(0, 4) || '—'}</span>
                  <span className="font-medium text-sm flex-1">{media._title}</span>
                  {credit.character && <span className="text-sm text-muted-foreground">as {credit.character}</span>}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {crewCredits.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Crew</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {crewCredits.map(credit => {
              const media = mediaMap[`${credit.media_type}-${credit.media_id}`]
              if (!media) return null
              return (
                <Link key={credit.id} to={`/${credit.media_type}/${credit.media_id}`}
                  className="flex items-center gap-4 p-3 hover:bg-accent transition-colors border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground w-12 flex-shrink-0">{media._date?.slice(0, 4) || '—'}</span>
                  <span className="font-medium text-sm flex-1">{media._title}</span>
                  {credit.job && <span className="text-sm text-muted-foreground">{credit.job}</span>}
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
