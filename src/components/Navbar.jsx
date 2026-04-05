import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Film, Search, User, Sun, Moon, Menu, X, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import SearchBar from './SearchBar'
import { cn } from '../utils/helpers'

const NAV_LINKS = [
  { to: '/',       label: 'Home',   exact: true },
  { to: '/movies', label: 'Movies' },
  { to: '/series', label: 'Series' },
  { to: '/genres', label: 'Genres' },
]

export default function Navbar() {
  const { user, profile, signOut } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const navigate = useNavigate()

  const [scrolled,     setScrolled]     = useState(false)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close menus on route change
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
    setUserMenuOpen(false)
  }, [navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-[#0b0b0f]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_40px_rgba(0,0,0,0.5)]'
            : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
        )}
      >
        <div className="ott-container">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow-xs group-hover:shadow-glow-sm transition-shadow">
                <Film className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-black text-lg tracking-tight hidden sm:block text-cinematic">
                Filmino
              </span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {NAV_LINKS.map(({ to, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  className={({ isActive }) => cn(
                    'px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/55 hover:text-white hover:bg-white/8'
                  )}
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Desktop search bar */}
            <div className="hidden lg:block w-64 xl:w-80">
              <SearchBar />
            </div>

            {/* Icon actions */}
            <div className="flex items-center gap-1">

              {/* Search toggle (mobile/tablet) */}
              <button
                onClick={() => setSearchOpen(v => !v)}
                className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all"
                aria-label="Search"
              >
                <Search className="h-4.5 w-4.5" />
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggle}
                className="h-9 w-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all"
                aria-label="Toggle theme"
              >
                {theme === 'dark'
                  ? <Sun className="h-4 w-4" />
                  : <Moon className="h-4 w-4" />
                }
              </button>

              {/* User menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-xs hover:shadow-glow-sm transition-shadow"
                  >
                    {profile?.username?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 glass-dark rounded-2xl shadow-card-xl z-50 overflow-hidden animate-scale-in border border-white/10">
                        <div className="px-4 py-3 border-b border-white/8">
                          <p className="text-sm font-semibold text-white truncate">{profile?.username}</p>
                          <p className="text-xs text-white/35 truncate mt-0.5">{profile?.email}</p>
                        </div>
                        <div className="py-1.5">
                          <Link to="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors">
                            <User className="h-4 w-4" /> Profile
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/8 transition-colors">
                            <LogOut className="h-4 w-4" /> Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-glow-xs hover:shadow-glow-sm"
                >
                  Sign in
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all ml-1"
                aria-label="Menu"
              >
                {menuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          {searchOpen && (
            <div className="lg:hidden pb-3 animate-fade-up">
              <SearchBar autoFocus />
            </div>
          )}
        </div>
      </header>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-16 left-0 right-0 z-40 glass-dark border-b border-white/8 md:hidden animate-fade-up">
            <nav className="ott-container py-4 flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => cn(
                    'px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/8'
                  )}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
