import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Clapperboard, Sun, Moon, Menu, X,
  User, LogOut, Bookmark, LayoutDashboard,
  Home, Search, Film, Info,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import SearchBar from './SearchBar'
import { Avatar } from './ui'
import { cn } from '../utils/helpers'

const NAV_LINKS = [
  { to: '/movies', label: 'Movies' },
  { to: '/series', label: 'Series' },
  { to: '/genres', label: 'Genres' },
]

const BOTTOM_TABS = [
  { to: '/',                  label: 'Home',      icon: Home,     exact: true },
  { to: '/search',            label: 'Search',    icon: Search },
  { to: '/movies',            label: 'Movies',    icon: Film },
  { to: '/profile/watchlist', label: 'Watchlist', icon: Bookmark },
  { to: '/profile',           label: 'Profile',   icon: User },
]

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const [scrolled,     setScrolled]     = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const isActive = (to, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  const handleSignOut = async () => {
    await signOut(); navigate('/'); setUserMenuOpen(false)
  }

  return (
    <>
      {/* ── Top bar ── */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-500',
        scrolled
          ? 'bg-[#0B0B0F]/85 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
          : 'bg-gradient-to-b from-black/60 via-black/20 to-transparent'
      )}>
        <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="h-8 w-8 rounded-[10px] bg-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.7)] transition-shadow">
              <Clapperboard className="h-4 w-4 text-white" />
            </div>
            <span className="hidden sm:block font-black text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
              Filmino
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5 ml-2">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(to)
                    ? 'bg-indigo-500/15 text-indigo-400'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop search */}
          <div className="hidden md:block flex-1 max-w-sm mx-auto">
            <SearchBar />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
            <button
              onClick={toggle}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/genres"
              className="h-9 w-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all"
            >
              <Info className="h-4 w-4" />
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-white/8 transition-all"
                >
                  <Avatar src={profile?.avatar_url} name={profile?.username} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-white/80 max-w-[88px] truncate">
                    {profile?.username}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#0B0B0F]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] z-20 overflow-hidden animate-scale-in">
                      <div className="px-4 py-3 border-b border-white/8">
                        <p className="text-sm font-semibold text-white">{profile?.username}</p>
                        <p className="text-xs text-white/35 truncate mt-0.5">{profile?.email}</p>
                      </div>
                      <div className="py-1">
                        {[
                          { to: '/profile',           icon: User,     label: 'Profile' },
                          { to: '/profile/watchlist', icon: Bookmark, label: 'Watchlist' },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/6 transition-colors">
                            <Icon className="h-4 w-4 text-white/35" />
                            {label}
                          </Link>
                        ))}
                        {isAdmin() && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-400 font-medium hover:bg-indigo-500/8 transition-colors">
                            <LayoutDashboard className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-white/8 py-1">
                        <button onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/8 transition-colors w-full text-left">
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 rounded-lg transition-all">
                  Sign In
                </Link>
                <Link to="/signup"
                  className="px-3.5 py-1.5 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-[#0B0B0F]/95 backdrop-blur-2xl border-t border-white/8 px-4 py-4 space-y-3 animate-fade-up">
            <SearchBar className="w-full" />
            <nav className="flex flex-col gap-0.5">
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  className={cn(
                    'px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive(to) ? 'bg-indigo-500/15 text-indigo-400' : 'text-white/70 hover:bg-white/6 hover:text-white'
                  )}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </nav>

      {/* ── Mobile bottom nav ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Glass bar */}
        <div className="bg-[#0B0B0F]/80 backdrop-blur-xl border-t border-white/[0.07] pb-safe">
          <div className="flex items-center justify-around h-[58px] px-2">
            {BOTTOM_TABS.map(({ to, label, icon: Icon, exact }) => {
              const active = isActive(to, exact)
              return (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-[3px] min-w-[52px] py-1 px-1"
                >
                  <div className={cn(
                    'h-[26px] w-[26px] flex items-center justify-center rounded-lg transition-all duration-200',
                    active ? 'bg-indigo-500/20 scale-110' : ''
                  )}>
                    <Icon className={cn(
                      'h-[18px] w-[18px] transition-colors duration-200',
                      active ? 'text-indigo-400' : 'text-white/40'
                    )} />
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium leading-none transition-colors duration-200',
                    active ? 'text-indigo-400' : 'text-white/35'
                  )}>
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
