import { useState, useEffect } from 'react'
import { adminService } from '../../services/admin'
import { Button, Skeleton } from '../../components/ui'
import { UserCheck, Shield, User } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await adminService.getAllUsers()
    setUsers(data || [])
    setLoading(false)
  }

  const approve = async (userId) => {
    await adminService.approveUser(userId)
    setUsers(u => u.map(x => x.id === userId ? { ...x, approved: true } : x))
  }

  const setRole = async (userId, role) => {
    await adminService.updateUserRole(userId, role)
    setUsers(u => u.map(x => x.id === userId ? { ...x, role } : x))
  }

  const filtered = users.filter(u => {
    if (filter === 'pending') return !u.approved
    if (filter === 'admin') return u.role === 'admin'
    return true
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'admin'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}>
            {f} {f === 'pending' && users.filter(u => !u.approved).length > 0 && `(${users.filter(u => !u.approved).length})`}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">User</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Joined</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <tr key={i}><td colSpan={4} className="p-3"><Skeleton className="h-8 w-full" /></td></tr>)
              : filtered.map(user => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{user.username?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.approved ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600'}`}>
                        {user.approved ? 'Approved' : 'Pending'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!user.approved && (
                        <button onClick={() => approve(user.id)}
                          className="flex items-center gap-1 text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded-lg hover:bg-green-500/30 transition-colors">
                          <UserCheck className="h-3 w-3" /> Approve
                        </button>
                      )}
                      {user.role !== 'admin' ? (
                        <button onClick={() => setRole(user.id, 'admin')}
                          className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors">
                          <Shield className="h-3 w-3" /> Make Admin
                        </button>
                      ) : (
                        <button onClick={() => setRole(user.id, 'user')}
                          className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-lg hover:bg-accent transition-colors">
                          <User className="h-3 w-3" /> Remove Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
