import { supabase } from './supabase'

export const personService = {
  async getById(id) {
    const { data, error } = await supabase.from('persons').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async getCredits(personId) {
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('person_id', personId)
    if (error) throw error
    return data
  },

  async getMediaCredits(mediaId, mediaType) {
    const { data, error } = await supabase
      .from('credits')
      .select('*, persons(id,name,profile_image)')
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .order('order')
    if (error) throw error
    return data
  },

  async upsertByTmdbId(person) {
    const { data, error } = await supabase
      .from('persons')
      .upsert(person, { onConflict: 'tmdb_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async create(person) {
    const { data, error } = await supabase.from('persons').insert(person).select().single()
    if (error) throw error
    return data
  },

  async insertCredits(credits) {
    const { error } = await supabase.from('credits').insert(credits)
    if (error) throw error
  },

  async deleteMediaCredits(mediaId, mediaType) {
    const { error } = await supabase
      .from('credits')
      .delete()
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
    if (error) throw error
  },

  async getAll({ page = 1, limit = 20, search } = {}) {
    let query = supabase
      .from('persons')
      .select('*', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1)
    if (search) query = query.ilike('name', `%${search}%`)
    const { data, error, count } = await query
    if (error) throw error
    return { data, count }
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('persons').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('persons').delete().eq('id', id)
    if (error) throw error
  },
}
