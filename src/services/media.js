import { supabase } from './supabase'

export const movieService = {
  async getAll({ page = 1, limit = 20, genre, search, sortBy = 'popularity' } = {}) {
    let query = supabase
      .from('movies')
      .select('id,title,poster,backdrop,vote_average,release_date,genres,popularity', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1)

    if (search) query = query.ilike('title', `%${search}%`)
    if (genre) query = query.contains('genres', JSON.stringify([{ name: genre }]))
    if (sortBy === 'popularity') query = query.order('popularity', { ascending: false })
    else if (sortBy === 'rating') query = query.order('vote_average', { ascending: false })
    else if (sortBy === 'newest') query = query.order('release_date', { ascending: false })
    else if (sortBy === 'title') query = query.order('title')

    const { data, error, count } = await query
    if (error) throw error
    return { data, count }
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getTrending(limit = 10) {
    const { data, error } = await supabase
      .from('movies')
      .select('id,title,poster,backdrop,vote_average,release_date,genres,popularity')
      .order('popularity', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  async getSimilar(movieId, genres = [], limit = 12) {
    // Try genre-matched first
    if (genres?.length) {
      const { data } = await supabase
        .from('movies')
        .select('id,title,poster,vote_average,release_date,genres')
        .neq('id', movieId)
        .contains('genres', JSON.stringify([{ name: genres[0] }]))
        .order('vote_average', { ascending: false })
        .limit(limit)
      if (data?.length) return data
    }
    const { data, error } = await supabase
      .from('movies')
      .select('id,title,poster,vote_average,release_date,genres')
      .neq('id', movieId)
      .order('popularity', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  async getTopRated(limit = 12) {
    const { data, error } = await supabase
      .from('movies')
      .select('id,title,poster,vote_average,release_date,genres')
      .gte('vote_average', 8.0)
      .order('vote_average', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  async create(movie) {
    const { data, error } = await supabase.from('movies').insert(movie).select().single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('movies').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('movies').delete().eq('id', id)
    if (error) throw error
  },

  async upsertByTmdbId(movie) {
    const { data, error } = await supabase
      .from('movies')
      .upsert(movie, { onConflict: 'tmdb_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },
}

export const seriesService = {
  async getAll({ page = 1, limit = 20, genre, search, sortBy = 'popularity' } = {}) {
    let query = supabase
      .from('series')
      .select('id,name,poster,backdrop,vote_average,first_air_date,genres,popularity', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1)

    if (search) query = query.ilike('name', `%${search}%`)
    if (genre) query = query.contains('genres', JSON.stringify([{ name: genre }]))
    if (sortBy === 'popularity') query = query.order('popularity', { ascending: false })
    else if (sortBy === 'rating') query = query.order('vote_average', { ascending: false })
    else if (sortBy === 'newest') query = query.order('first_air_date', { ascending: false })
    else if (sortBy === 'title') query = query.order('name')

    const { data, error, count } = await query
    if (error) throw error
    return { data, count }
  },

  async getById(id) {
    const { data, error } = await supabase.from('series').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async getTrending(limit = 10) {
    const { data, error } = await supabase
      .from('series')
      .select('id,name,poster,backdrop,vote_average,first_air_date,genres,popularity')
      .order('popularity', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  async getSeasons(seriesId) {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('series_id', seriesId)
      .order('season_number')
    if (error) throw error
    return data
  },

  async getEpisodes(seasonId) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('season_id', seasonId)
      .order('episode_number')
    if (error) throw error
    return data
  },

  async create(series) {
    const { data, error } = await supabase.from('series').insert(series).select().single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('series').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('series').delete().eq('id', id)
    if (error) throw error
  },

  async upsertByTmdbId(series) {
    const { data, error } = await supabase
      .from('series')
      .upsert(series, { onConflict: 'tmdb_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },
}
