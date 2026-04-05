import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import MediaCard from '../components/MediaCard'
import { Link } from 'react-router-dom'
import { Skeleton } from '../components/ui'
import { debounce } from '../utils/helpers'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState({ movies: [], series: [], persons: [] })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    if (!query) return
    search(query)
  }, [query])

  async function search(q) {
    setLoading(true)
    try {
      const [movies, series, persons] = await Promise.all([
        supabase.from('movies').select('id,title,poster,vote_average,release_date,genres').ilike('title', `%${q}%`).limit(20),
        supabase.from('series').select('id,name,poster,vote_average,first_air_date,genres').ilike('name', `%${q}%`).limit(20),
        supabase.from('persons').select('id,name,profile_image,known_for_department').ilike('name', `%${q}%`).limit(12),
      ])
      setResults({ movies: movies.data || [], series: series.data || [], persons: persons.data || [] })
    } finally {
      setLoading(false)
    }
  }

  const total = results.movies.length + results.series.length + results.persons.length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search results for "{query}"</h1>
        {!loading && <p className="text-muted-foreground text-sm mt-1">{total} results found</p>}
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'movies', 'series', 'people'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {(tab === 'all' || tab === 'movies') && results.movies.length > 0 && (
            <section>
              {tab === 'all' && <h2 className="text-lg font-semibold mb-4">Movies</h2>}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {results.movies.map(m => <MediaCard key={m.id} item={m} type="movie" />)}
              </div>
            </section>
          )}
          {(tab === 'all' || tab === 'series') && results.series.length > 0 && (
            <section>
              {tab === 'all' && <h2 className="text-lg font-semibold mb-4">Series</h2>}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {results.series.map(s => <MediaCard key={s.id} item={s} type="series" />)}
              </div>
            </section>
          )}
          {(tab === 'all' || tab === 'people') && results.persons.length > 0 && (
            <section>
              {tab === 'all' && <h2 className="text-lg font-semibold mb-4">People</h2>}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {results.persons.map(p => (
                  <Link key={p.id} to={`/person/${p.id}`} className="group text-center">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-2">
                      {p.profile_image
                        ? <img src={p.profile_image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl text-muted-foreground">{p.name?.[0]}</div>
                      }
                    </div>
                    <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.known_for_department}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {total === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No results found for "{query}"</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
