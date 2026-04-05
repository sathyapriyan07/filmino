import { Outlet, useLocation, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Clapperboard } from 'lucide-react'

export default function MainLayout() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0 page-enter" key={location.pathname}>
        <Outlet />
      </main>

      {/* Footer — desktop only */}
      <footer className="hidden md:block mt-20 border-t border-border/40 bg-card/40">
        <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-7 w-7 rounded-[8px] bg-primary flex items-center justify-center shadow-glow-xs group-hover:shadow-glow-sm transition-shadow">
                <Clapperboard className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-black text-lg tracking-tight gradient-text">Filmino</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              {[['Movies','/movies'],['Series','/series'],['Genres','/genres']].map(([l,h]) => (
                <Link key={h} to={h} className="hover:text-foreground transition-colors duration-200">{l}</Link>
              ))}
            </nav>
            <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} Filmino</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
