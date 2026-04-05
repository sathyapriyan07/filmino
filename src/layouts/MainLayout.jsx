import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Film } from 'lucide-react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-20">
      <div className="ott-container py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Film className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-white/60 font-bold text-sm text-cinematic">Filmino</span>
          </Link>
          <div className="flex items-center gap-6 text-xs text-white/25">
            <Link to="/movies" className="hover:text-white/50 transition-colors">Movies</Link>
            <Link to="/series" className="hover:text-white/50 transition-colors">Series</Link>
            <Link to="/genres" className="hover:text-white/50 transition-colors">Genres</Link>
            <Link to="/search" className="hover:text-white/50 transition-colors">Search</Link>
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Filmino</p>
        </div>
      </div>
    </footer>
  )
}

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#0b0b0f] flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
