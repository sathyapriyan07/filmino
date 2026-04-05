import { useState, useEffect } from 'react'
import { adminService } from '../../services/admin'
import { Film, Tv, Users, Star } from 'lucide-react'
import { Skeleton } from '../../components/ui'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [s, p] = await Promise.all([adminService.getStats(), adminService.getPendingUsers()])
      setStats(s)
      setPending(p)
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Movies', value: stats?.movies, icon: Film, color: 'text-blue-500' },
    { label: 'Series', value: stats?.series, icon: Tv, color: 'text-purple-500' },
    { label: 'Users', value: stats?.users, icon: Users, color: 'text-green-500' },
    { label: 'Reviews', value: stats?.reviews, icon: Star, color: 'text-yellow-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{value?.toLocaleString()}</div>}
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            Pending Approvals ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium">{u.username}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <button
                  onClick={async () => {
                    await adminService.approveUser(u.id)
                    setPending(p => p.filter(x => x.id !== u.id))
                  }}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
