import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Clapperboard } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MainLayout() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0 page-enter" key={location.pathname}>
        <Outlet />
      </main>
      <footer className="hidden md:block border-t border-border/60 py-10 mt-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 font-black text-lg tracking-tight">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <Clapperboard className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="gradient-text">Filmino</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/movies" className="hover:text-foreground transition-colors">Movies</Link>
              <Link to="/series" className="hover:text-foreground transition-colors">Series</Link>
              <Link to="/genres" className="hover:text-foreground transition-colors">Genres</Link>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Filmino. Powered by Supabase.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
