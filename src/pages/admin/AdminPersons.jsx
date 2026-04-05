import { useState, useEffect } from 'react'
import { personService } from '../../services/persons'
import { Button, Input, Skeleton } from '../../components/ui'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import Modal from '../../components/Modal'

const EMPTY = { name: '', biography: '', birthday: '', place_of_birth: '', profile_image: '', known_for_department: '' }

export default function AdminPersons() {
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const LIMIT = 20

  useEffect(() => { load() }, [page, search])

  async function load() {
    setLoading(true)
    try {
      const { data, count } = await personService.getAll({ page, limit: LIMIT, search })
      setPersons(data || [])
      setTotal(count || 0)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit = (p) => { setForm({ ...p, birthday: p.birthday || '' }); setModal('edit') }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = { ...form, birthday: form.birthday || null }
      if (modal === 'create') await personService.create(data)
      else await personService.update(form.id, data)
      setModal(null)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this person?')) return
    await personService.delete(id)
    load()
  }

  const f = (key) => ({ value: form[key] || '', onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Persons <span className="text-muted-foreground text-lg font-normal">({total})</span></h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Person</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search persons..." className="pl-10" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Person</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Department</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <tr key={i}><td colSpan={3} className="p-3"><Skeleton className="h-8 w-full" /></td></tr>)
              : persons.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.profile_image && <img src={p.profile_image} alt="" className="w-8 h-8 object-cover rounded-full" />}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{p.known_for_department || '—'}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Person' : 'Edit Person'}>
        <div className="space-y-4">
          <div><label className="text-xs font-medium mb-1 block">Name *</label><Input {...f('name')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Known For Department</label><Input {...f('known_for_department')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Birthday</label><Input type="date" {...f('birthday')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Place of Birth</label><Input {...f('place_of_birth')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Profile Image URL</label><Input {...f('profile_image')} /></div>
          <div><label className="text-xs font-medium mb-1 block">Biography</label><textarea {...f('biography')} rows={4} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </Modal>
    </div>
  )
}
