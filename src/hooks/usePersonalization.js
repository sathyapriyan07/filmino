import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { watchlistService } from '../services/social'
import { getGenreNames } from '../utils/helpers'

export function usePersonalization(userId) {
  const [recommended, setRecommended] = useState([])

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      try {
        const wl = await watchlistService.get(userId)
        if (!wl?.length || cancelled) return

        const movieIds = wl.filter(i => i.media_type === 'movie').map(i => i.media_id).slice(0, 10)
        if (!movieIds.length) return

        const { data: movies } = await supabase
          .from('movies')
          .select('genres')
          .in('id', movieIds)

        const genreCount = {}
        ;(movies || []).forEach(m => {
          getGenreNames(m.genres).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1 })
        })

        const topGenres = Object.entries(genreCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([g]) => g)

        if (!topGenres.length || cancelled) return

        const { data: recs } = await supabase
          .from('movies')
          .select('id,title,poster,vote_average,release_date,genres')
          .not('id', 'in', `(${movieIds.join(',')})`)
          .order('vote_average', { ascending: false })
          .limit(20)

        if (cancelled) return

        const scored = (recs || [])
          .map(m => ({
            ...m,
            _type: 'movie',
            _score: getGenreNames(m.genres).filter(g => topGenres.includes(g)).length,
          }))
          .filter(m => m._score > 0)
          .sort((a, b) => b._score - a._score)
          .slice(0, 12)

        setRecommended(scored)
      } catch { /* silent */ }
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  return { recommended }
}
