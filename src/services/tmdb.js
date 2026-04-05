// TMDb import service - fetches from TMDb API and stores in Supabase
// TMDB_BASE is only used in admin import flow, not in UI runtime
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p'

const apiKey = () => import.meta.env.VITE_TMDB_API_KEY

async function tmdbFetch(path) {
  const res = await fetch(`${TMDB_BASE}${path}?api_key=${apiKey()}&language=en-US`)
  if (!res.ok) throw new Error(`TMDb fetch failed: ${path}`)
  return res.json()
}

function imgUrl(path, size = 'original') {
  return path ? `${TMDB_IMG}/${size}${path}` : null
}

export const tmdbImport = {
  async importMovie(tmdbId, { movieService, personService, mediaImageService, mediaVideoService, genreService }) {
    const [movie, credits, videos, images] = await Promise.all([
      tmdbFetch(`/movie/${tmdbId}`),
      tmdbFetch(`/movie/${tmdbId}/credits`),
      tmdbFetch(`/movie/${tmdbId}/videos`),
      tmdbFetch(`/movie/${tmdbId}/images`),
    ])

    const trailer = videos.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')

    const movieData = {
      tmdb_id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview,
      tagline: movie.tagline,
      status: movie.status,
      release_date: movie.release_date || null,
      runtime: movie.runtime,
      poster: imgUrl(movie.poster_path, 'w500'),
      backdrop: imgUrl(movie.backdrop_path, 'original'),
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      budget: movie.budget,
      revenue: movie.revenue,
      genres: movie.genres || [],
      language: movie.original_language,
      trailer_key: trailer?.key || null,
    }

    const savedMovie = await movieService.upsertByTmdbId(movieData)

    // Upsert genres
    for (const g of movie.genres || []) {
      await genreService.upsert({ name: g.name })
    }

    // Save images
    await mediaImageService.deleteForMedia(savedMovie.id, 'movie')
    const backdrops = (images.backdrops || []).slice(0, 10).map(img => ({
      media_id: savedMovie.id, media_type: 'movie',
      file_path: imgUrl(img.file_path, 'w1280'), image_type: 'backdrop',
    }))
    const posters = (images.posters || []).slice(0, 5).map(img => ({
      media_id: savedMovie.id, media_type: 'movie',
      file_path: imgUrl(img.file_path, 'w500'), image_type: 'poster',
    }))
    if (backdrops.length + posters.length > 0) {
      await mediaImageService.insertMany([...backdrops, ...posters])
    }

    // Save videos
    await mediaVideoService.deleteForMedia(savedMovie.id, 'movie')
    const videoData = (videos.results || []).filter(v => v.site === 'YouTube').slice(0, 5).map(v => ({
      media_id: savedMovie.id, media_type: 'movie',
      name: v.name, key: v.key, site: v.site, video_type: v.type,
    }))
    if (videoData.length > 0) await mediaVideoService.insertMany(videoData)

    // Save credits
    await personService.deleteMediaCredits(savedMovie.id, 'movie')
    const cast = (credits.cast || []).slice(0, 20)
    const crew = (credits.crew || []).filter(c => ['Director', 'Producer', 'Screenplay', 'Writer'].includes(c.job)).slice(0, 10)

    for (const member of [...cast, ...crew]) {
      const person = await personService.upsertByTmdbId({
        tmdb_id: member.id,
        name: member.name,
        profile_image: imgUrl(member.profile_path, 'w185'),
        known_for_department: member.known_for_department,
      })
      await personService.insertCredits([{
        media_id: savedMovie.id,
        media_type: 'movie',
        person_id: person.id,
        role: member.character !== undefined ? 'cast' : 'crew',
        character: member.character || null,
        job: member.job || null,
        department: member.department || null,
        order: member.order || 0,
      }])
    }

    return savedMovie
  },

  async importSeries(tmdbId, { seriesService, personService, mediaImageService, mediaVideoService, genreService }) {
    const [show, credits, videos, images] = await Promise.all([
      tmdbFetch(`/tv/${tmdbId}`),
      tmdbFetch(`/tv/${tmdbId}/credits`),
      tmdbFetch(`/tv/${tmdbId}/videos`),
      tmdbFetch(`/tv/${tmdbId}/images`),
    ])

    const trailer = videos.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')

    const seriesData = {
      tmdb_id: show.id,
      name: show.name,
      overview: show.overview,
      first_air_date: show.first_air_date || null,
      status: show.status,
      poster: imgUrl(show.poster_path, 'w500'),
      backdrop: imgUrl(show.backdrop_path, 'original'),
      vote_average: show.vote_average,
      vote_count: show.vote_count,
      popularity: show.popularity,
      genres: show.genres || [],
      language: show.original_language,
      trailer_key: trailer?.key || null,
    }

    const savedSeries = await seriesService.upsertByTmdbId(seriesData)

    for (const g of show.genres || []) {
      await genreService.upsert({ name: g.name })
    }

    // Save images
    await mediaImageService.deleteForMedia(savedSeries.id, 'series')
    const backdrops = (images.backdrops || []).slice(0, 10).map(img => ({
      media_id: savedSeries.id, media_type: 'series',
      file_path: imgUrl(img.file_path, 'w1280'), image_type: 'backdrop',
    }))
    if (backdrops.length > 0) await mediaImageService.insertMany(backdrops)

    // Save videos
    await mediaVideoService.deleteForMedia(savedSeries.id, 'series')
    const videoData = (videos.results || []).filter(v => v.site === 'YouTube').slice(0, 5).map(v => ({
      media_id: savedSeries.id, media_type: 'series',
      name: v.name, key: v.key, site: v.site, video_type: v.type,
    }))
    if (videoData.length > 0) await mediaVideoService.insertMany(videoData)

    // Save seasons
    const { supabase } = await import('./supabase')
    for (const season of show.seasons || []) {
      const { data: savedSeason } = await supabase
        .from('seasons')
        .upsert({
          series_id: savedSeries.id,
          season_number: season.season_number,
          name: season.name,
          overview: season.overview,
          poster: imgUrl(season.poster_path, 'w300'),
          air_date: season.air_date || null,
        }, { onConflict: 'series_id,season_number' })
        .select()
        .single()

      if (savedSeason) {
        const seasonDetail = await tmdbFetch(`/tv/${tmdbId}/season/${season.season_number}`)
        const episodes = (seasonDetail.episodes || []).map(ep => ({
          season_id: savedSeason.id,
          episode_number: ep.episode_number,
          name: ep.name,
          overview: ep.overview,
          runtime: ep.runtime,
          air_date: ep.air_date || null,
          rating: ep.vote_average || 0,
          still: imgUrl(ep.still_path, 'w300'),
        }))
        if (episodes.length > 0) {
          await supabase.from('episodes').delete().eq('season_id', savedSeason.id)
          await supabase.from('episodes').insert(episodes)
        }
      }
    }

    // Save credits
    await personService.deleteMediaCredits(savedSeries.id, 'series')
    const cast = (credits.cast || []).slice(0, 20)
    const crew = (credits.crew || []).filter(c => ['Creator', 'Executive Producer', 'Director'].includes(c.job)).slice(0, 10)

    for (const member of [...cast, ...crew]) {
      const person = await personService.upsertByTmdbId({
        tmdb_id: member.id,
        name: member.name,
        profile_image: imgUrl(member.profile_path, 'w185'),
        known_for_department: member.known_for_department,
      })
      await personService.insertCredits([{
        media_id: savedSeries.id,
        media_type: 'series',
        person_id: person.id,
        role: member.character !== undefined ? 'cast' : 'crew',
        character: member.character || null,
        job: member.job || null,
        department: member.department || null,
        order: member.order || 0,
      }])
    }

    return savedSeries
  },
}
