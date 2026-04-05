import { useState, useEffect } from 'react'
import { genreService, mediaImageService } from '../../services/admin'
import { supabase } from '../../services/supabase'
import { Button, Input } from '../../components/ui'
import { Pencil, Image } from 'lucide-react'
import Modal from '../../components/Modal'

export default function AdminGenres() {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [mediaSearch, setMediaSearch] = useState('')
  const [mediaResults, setMediaResults] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await genreService.getAll()
    setGenres(data)
    setLoading(false)
  }

  const searchMedia = async (q) => {
    if (!q.trim()) { setMediaResults([]); return }
    const [movies, series] = await Promise.all([
      supabase.from('movies').select('id,title,backdrop').ilike('title', `%${q}%`).not('backdrop', 'is', null).limit(5),
      supabase.from('series').select('id,name,backdrop').ilike('name', `%${q}%`).not('backdrop', 'is', null).limit(5),
    ])
    setMediaResults([
      ...(movies.data || []).map(m => ({ ...m, _type: 'movie', _title: m.title })),
      ...(series.data || []).map(s => ({ ...s, _type: 'series', _title: s.name })),
    ])
  }

  const setBackdrop = async (genre, media) => {
    setSaving(true)
    try {
      await genreService.update(genre.id, { backdrop_media_id: media.id, backdrop_media_type: media._type })
      setModal(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Genres</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {genres.map(genre => (
          <div key={genre.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="h-24 bg-muted relative">
              {genre.backdrop_media_id && <BackdropPreview genre={genre} />}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-bold">{genre.name}</span>
              </div>
            </div>
            <div className="p-2 flex justify-end">
              <button onClick={() => { setSelected(genre); setMediaSearch(''); setMediaResults([]); setModal('backdrop') }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Image className="h-3 w-3" /> Set Backdrop
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal === 'backdrop'} onClose={() => setModal(null)} title={`Set backdrop for "${selected?.name}"`}>
        <Input
          value={mediaSearch}
          onChange={e => { setMediaSearch(e.target.value); searchMedia(e.target.value) }}
          placeholder="Search movies or series..."
          className="mb-4"
        />
        <div className="space-y-2">
          {mediaResults.map(media => (
            <button key={`${media._type}-${media.id}`} onClick={() => setBackdrop(selected, media)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left">
              <img src={media.backdrop} alt={media._title} className="w-20 h-12 object-cover rounded" />
              <div>
                <div className="text-sm font-medium">{media._title}</div>
                <div className="text-xs text-muted-foreground capitalize">{media._type}</div>
              </div>
            </button>
          ))}
          {mediaSearch && mediaResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No results with backdrop found</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

function BackdropPreview({ genre }) {
  const [backdrop, setBackdrop] = useState(null)

  useEffect(() => {
    async function load() {
      const table = genre.backdrop_media_type === 'movie' ? 'movies' : 'series'
      const { data } = await supabase.from(table).select('backdrop').eq('id', genre.backdrop_media_id).single()
      setBackdrop(data?.backdrop)
    }
    load()
  }, [genre.backdrop_media_id])

  if (!backdrop) return null
  return <img src={backdrop} alt="" className="w-full h-full object-cover" />
}
