import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LayoutDashboard, Film, Tv, Users, Tag, Layers, Star, Download, UserCheck } from 'lucide-react'
import { cn } from '../utils/helpers'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/movies', label: 'Movies', icon: Film },
  { to: '/admin/series', label: 'Series', icon: Tv },
  { to: '/admin/persons', label: 'Persons', icon: Users },
  { to: '/admin/genres', label: 'Genres', icon: Tag },
  { to: '/admin/sections', label: 'Sections', icon: Layers },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/users', label: 'Users', icon: UserCheck },
  { to: '/admin/import', label: 'TMDb Import', icon: Download },
]

export default function AdminLayout() {
  const { isAdmin, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return null
  if (!isAdmin()) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/" className="text-lg font-bold text-primary">MovieDB Admin</Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur flex items-center px-6 gap-4">
          <div className="md:hidden font-bold text-primary">Admin</div>
          <div className="flex-1" />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to site
          </Link>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
