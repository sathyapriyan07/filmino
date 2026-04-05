import { supabase } from './supabase'

export const reviewService = {
  async getForMedia(mediaId, mediaType) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(username, avatar_url)')
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getUserReview(userId, mediaId, mediaType) {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .single()
    return data
  },

  async upsert(review) {
    const { data, error } = await supabase
      .from('reviews')
      .upsert(review, { onConflict: 'user_id,media_id,media_type' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) throw error
  },

  async getAll({ page = 1, limit = 20 } = {}) {
    const { data, error, count } = await supabase
      .from('reviews')
      .select('*, users(username)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (error) throw error
    return { data, count }
  },
}

export const watchlistService = {
  async get(userId) {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })
    if (error) throw error
    return data
  },

  async add(userId, mediaId, mediaType) {
    const { data, error } = await supabase
      .from('watchlist')
      .insert({ user_id: userId, media_id: mediaId, media_type: mediaType })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(userId, mediaId, mediaType) {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
    if (error) throw error
  },

  async check(userId, mediaId, mediaType) {
    const { data } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .single()
    return !!data
  },
}

export const ratingService = {
  async getUserRating(userId, mediaId, mediaType) {
    const { data } = await supabase
      .from('ratings')
      .select('rating')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .single()
    return data?.rating || null
  },

  async upsert(userId, mediaId, mediaType, rating) {
    const { data, error } = await supabase
      .from('ratings')
      .upsert({ user_id: userId, media_id: mediaId, media_type: mediaType, rating }, { onConflict: 'user_id,media_id,media_type' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getUserRatings(userId) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
}
