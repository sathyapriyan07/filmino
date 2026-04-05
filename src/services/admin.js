import { supabase } from './supabase'

export const sectionService = {
  async getActiveSections() {
    const { data, error } = await supabase
      .from('sections')
      .select('*, section_items(id,media_id,media_type,order_index)')
      .eq('is_active', true)
      .order('order_index')
    if (error) throw error
    return data
  },

  async getAll() {
    const { data, error } = await supabase
      .from('sections')
      .select('*, section_items(id,media_id,media_type,order_index)')
      .order('order_index')
    if (error) throw error
    return data
  },

  async create(section) {
    const { data, error } = await supabase.from('sections').insert(section).select().single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('sections').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('sections').delete().eq('id', id)
    if (error) throw error
  },

  async addItem(sectionId, mediaId, mediaType, orderIndex = 0) {
    const { data, error } = await supabase
      .from('section_items')
      .insert({ section_id: sectionId, media_id: mediaId, media_type: mediaType, order_index: orderIndex })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async removeItem(itemId) {
    const { error } = await supabase.from('section_items').delete().eq('id', itemId)
    if (error) throw error
  },

  async reorderItems(items) {
    const updates = items.map(({ id, order_index }) =>
      supabase.from('section_items').update({ order_index }).eq('id', id)
    )
    await Promise.all(updates)
  },
}

export const genreService = {
  async getAll() {
    const { data, error } = await supabase.from('genres').select('*').order('name')
    if (error) throw error
    return data
  },

  async upsert(genre) {
    const { data, error } = await supabase
      .from('genres')
      .upsert(genre, { onConflict: 'name' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('genres').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}

export const mediaImageService = {
  async getForMedia(mediaId, mediaType) {
    const { data, error } = await supabase
      .from('media_images')
      .select('*')
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
    if (error) throw error
    return data
  },

  async insertMany(images) {
    const { error } = await supabase.from('media_images').insert(images)
    if (error) throw error
  },

  async deleteForMedia(mediaId, mediaType) {
    const { error } = await supabase
      .from('media_images')
      .delete()
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
    if (error) throw error
  },
}

export const mediaVideoService = {
  async getForMedia(mediaId, mediaType) {
    const { data, error } = await supabase
      .from('media_videos')
      .select('*')
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
    if (error) throw error
    return data
  },

  async insertMany(videos) {
    const { error } = await supabase.from('media_videos').insert(videos)
    if (error) throw error
  },

  async deleteForMedia(mediaId, mediaType) {
    const { error } = await supabase
      .from('media_videos')
      .delete()
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
    if (error) throw error
  },
}

export const adminService = {
  async getStats() {
    const [movies, series, users, reviews] = await Promise.all([
      supabase.from('movies').select('id', { count: 'exact', head: true }),
      supabase.from('series').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
    ])
    return {
      movies: movies.count || 0,
      series: series.count || 0,
      users: users.count || 0,
      reviews: reviews.count || 0,
    }
  },

  async getPendingUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async approveUser(userId) {
    const { error } = await supabase.from('users').update({ approved: true }).eq('id', userId)
    if (error) throw error
  },

  async updateUserRole(userId, role) {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId)
    if (error) throw error
  },
}
