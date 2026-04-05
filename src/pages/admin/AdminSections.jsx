import { useState, useEffect } from 'react'
import { sectionService } from '../../services/admin'
import { supabase } from '../../services/supabase'
import { Button, Input, Select } from '../../components/ui'
import { Plus, Trash2, GripVertical, X } from 'lucide-react'
import Modal from '../../components/Modal'

export default function AdminSections() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ title: '', type: 'mixed', order_index: 0, is_active: true })
  const [selectedSection, setSelectedSection] = useState(null)
  const [mediaSearch, setMediaSearch] = useState('')
  const [mediaResults, setMediaResults] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await sectionService.getAll()
    setSections(data || [])
    setLoading(false)
  }

  const createSection = async () => {
    setSaving(true)
    try {
      await sectionService.create({ ...form, order_index: sections.length })
      setModal(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const deleteSection = async (id) => {
    if (!confirm('Delete this section?')) return
    await sectionService.delete(id)
    load()
  }

  const toggleActive = async (section) => {
    await sectionService.update(section.id, { is_active: !section.is_active })
    load()
  }

  const searchMedia = async (q) => {
    if (!q.trim()) { setMediaResults([]); return }
    const [movies, series] = await Promise.all([
      supabase.from('movies').select('id,title,poster').ilike('title', `%${q}%`).limit(5),
      supabase.from('series').select('id,name,poster').ilike('name', `%${q}%`).limit(5),
    ])
    setMediaResults([
      ...(movies.data || []).map(m => ({ ...m, _type: 'movie', _title: m.title })),
      ...(series.data || []).map(s => ({ ...s, _type: 'series', _title: s.name })),
    ])
  }

  const addItem = async (media) => {
    const items = selectedSection.section_items || []
    await sectionService.addItem(selectedSection.id, media.id, media._type, items.length)
    load()
    setSelectedSection(prev => ({
      ...prev,
      section_items: [...(prev.section_items || []), { media_id: media.id, media_type: media._type, order_index: items.length }]
    }))
  }

  const removeItem = async (itemId) => {
    await sectionService.removeItem(itemId)
    load()
    setSelectedSection(prev => ({
      ...prev,
      section_items: (prev.section_items || []).filter(i => i.id !== itemId)
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Homepage Sections</h1>
        <Button onClick={() => setModal('create')} className="gap-2"><Plus className="h-4 w-4" /> Add Section</Button>
      </div>

      <div className="space-y-3">
        {sections.map(section => (
          <div key={section.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{section.title}</span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full capitalize">{section.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${section.is_active ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    {section.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{(section.section_items || []).length} items</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(section)} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors">
                  {section.is_active ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => { setSelectedSection(section); setMediaSearch(''); setMediaResults([]); setModal('items') }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  Manage Items
                </button>
                <button onClick={() => deleteSection(section.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && sections.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No sections yet. Create one to get started.</div>
        )}
      </div>

      {/* Create Section Modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Create Section">
        <div className="space-y-4">
          <div><label className="text-xs font-medium mb-1 block">Title</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Trending Now" />
          </div>
          <div><label className="text-xs font-medium mb-1 block">Type</label>
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="mixed">Mixed</option>
              <option value="movie">Movies Only</option>
              <option value="series">Series Only</option>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={createSection} disabled={saving || !form.title}>{saving ? 'Creating...' : 'Create'}</Button>
        </div>
      </Modal>

      {/* Manage Items Modal */}
      <Modal open={modal === 'items'} onClose={() => setModal(null)} title={`Manage: ${selectedSection?.title}`} className="max-w-2xl">
        <div className="mb-4">
          <Input
            value={mediaSearch}
            onChange={e => { setMediaSearch(e.target.value); searchMedia(e.target.value) }}
            placeholder="Search and add movies or series..."
          />
          {mediaResults.length > 0 && (
            <div className="mt-2 border border-border rounded-xl overflow-hidden">
              {mediaResults.map(media => (
                <button key={`${media._type}-${media.id}`} onClick={() => addItem(media)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-accent transition-colors text-left border-b border-border last:border-0">
                  {media.poster && <img src={media.poster} alt="" className="w-8 h-12 object-cover rounded" />}
                  <div>
                    <div className="text-sm font-medium">{media._title}</div>
                    <div className="text-xs text-muted-foreground capitalize">{media._type}</div>
                  </div>
                  <Plus className="h-4 w-4 ml-auto text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">Current Items ({(selectedSection?.section_items || []).length})</div>
          {(selectedSection?.section_items || []).map(item => (
            <SectionItemRow key={item.id} item={item} onRemove={removeItem} />
          ))}
          {(selectedSection?.section_items || []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No items yet. Search above to add.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

function SectionItemRow({ item, onRemove }) {
  const [media, setMedia] = useState(null)

  useEffect(() => {
    async function load() {
      const table = item.media_type === 'movie' ? 'movies' : 'series'
      const field = item.media_type === 'movie' ? 'id,title,poster' : 'id,name,poster'
      const { data } = await supabase.from(table).select(field).eq('id', item.media_id).single()
      setMedia(data)
    }
    load()
  }, [item.media_id])

  const title = item.media_type === 'movie' ? media?.title : media?.name

  return (
    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
      {media?.poster && <img src={media.poster} alt="" className="w-8 h-12 object-cover rounded" />}
      <div className="flex-1">
        <div className="text-sm font-medium">{title || '...'}</div>
        <div className="text-xs text-muted-foreground capitalize">{item.media_type}</div>
      </div>
      <button onClick={() => onRemove(item.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
