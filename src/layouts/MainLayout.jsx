import { Outlet, useLocation, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Clapperboard } from 'lucide-react'

export default function MainLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B0F]">
      <Navbar />

      {/* No top padding on home so hero bleeds under transparent nav */}
      <main
        className={`flex-1 pb-[70px] md:pb-0 page-enter bg-[#0B0B0F] ${isHome ? '' : 'pt-16'}`}
        key={location.pathname}
      >
        <Outlet />
      </main>

      {/* Footer — desktop only */}
      <footer className="hidden md:block border-t border-white/[0.06] bg-[#0B0B0F]">
        <div className="max-w-[1400px] mx-auto px-10 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-7 w-7 rounded-[8px] bg-indigo-600 flex items-center justify-center">
                <Clapperboard className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-black text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                Filmino
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-white/35">
              {[['Movies', '/movies'], ['Series', '/series'], ['Genres', '/genres']].map(([l, h]) => (
                <Link key={h} to={h} className="hover:text-white/70 transition-colors">{l}</Link>
              ))}
            </nav>
            <p className="text-xs text-white/20">© {new Date().getFullYear()} Filmino</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
