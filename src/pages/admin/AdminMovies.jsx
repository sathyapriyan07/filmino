import { useState, useEffect } from 'react'
import { movieService } from '../../services/media'
import { Button, Input, Skeleton } from '../../components/ui'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import Modal from '../../components/Modal'
import { formatDate } from '../../utils/helpers'

const EMPTY = { title: '', original_title: '', overview: '', tagline: '', status: 'Released', release_date: '', runtime: '', poster: '', backdrop: '', vote_average: '', vote_count: '', popularity: '', budget: '', revenue: '', language: 'en', genres: '[]' }

export default function AdminMovies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const LIMIT = 20

  useEffect(() => { load() }, [page, search])

  async function load() {
    setLoading(true)
    try {
      const { data, count } = await movieService.getAll({ page, limit: LIMIT, search })
      setMovies(data || [])
      setTotal(count || 0)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit = (movie) => {
    setForm({
      ...movie,
      genres: typeof movie.genres === 'string' ? movie.genres : JSON.stringify(movie.genres || []),
      release_date: movie.release_date || '',
    })
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = {
        ...form,
        runtime: form.runtime ? parseInt(form.runtime) : null,
        vote_average: form.vote_average ? parseFloat(form.vote_average) : 0,
        vote_count: form.vote_count ? parseInt(form.vote_count) : 0,
        popularity: form.popularity ? parseFloat(form.popularity) : 0,
        budget: form.budget ? parseInt(form.budget) : 0,
        revenue: form.revenue ? parseInt(form.revenue) : 0,
        genres: typeof form.genres === 'string' ? JSON.parse(form.genres || '[]') : form.genres,
        release_date: form.release_date || null,
      }
      if (modal === 'create') await movieService.create(data)
      else await movieService.update(form.id, data)
      setModal(null)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this movie?')) return
    await movieService.delete(id)
    load()
  }

  const f = (key) => ({ value: form[key] || '', onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Movies <span className="text-muted-foreground text-lg font-normal">({total})</span></h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Movie</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search movies..." className="pl-10" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Movie</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Release</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Rating</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="p-3"><Skeleton className="h-8 w-full" /></td></tr>
              ))
              : movies.map(movie => (
                <tr key={movie.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {movie.poster && <img src={movie.poster} alt="" className="w-8 h-12 object-cover rounded" />}
                      <span className="font-medium">{movie.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{movie.release_date?.slice(0, 4) || '—'}</td>
                  <td className="p-3 hidden md:table-cell">{movie.vote_average || '—'}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(movie)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(movie.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {Math.ceil(total / LIMIT) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / LIMIT)}</span>
          <Button variant="outline" size="sm" disabled={page === Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Movie' : 'Edit Movie'} className="max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Title *</label><Input {...f('title')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Original Title</label><Input {...f('original_title')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Language</label><Input {...f('language')} /></div>
          <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Overview</label><textarea {...f('overview')} rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label className="text-xs font-medium mb-1 block">Tagline</label><Input {...f('tagline')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Status</label><Input {...f('status')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Release Date</label><Input type="date" {...f('release_date')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Runtime (min)</label><Input type="number" {...f('runtime')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Vote Average</label><Input type="number" step="0.1" {...f('vote_average')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Vote Count</label><Input type="number" {...f('vote_count')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Popularity</label><Input type="number" step="0.001" {...f('popularity')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Budget</label><Input type="number" {...f('budget')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Revenue</label><Input type="number" {...f('revenue')} /></div>
          <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Poster URL</label><Input {...f('poster')} /></div>
          <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Backdrop URL</label><Input {...f('backdrop')} /></div>
          <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Genres (JSON)</label><Input {...f('genres')} placeholder='[{"id":28,"name":"Action"}]' /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </Modal>
    </div>
  )
}
