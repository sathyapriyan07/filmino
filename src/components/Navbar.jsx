import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Clapperboard, Sun, Moon, Menu, X, User, LogOut, Bookmark, LayoutDashboard, Home, Search, Film, Tv, Info } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import SearchBar from './SearchBar'
import { Avatar } from './ui'
import { cn } from '../utils/helpers'

const navLinks = [
  { to: '/movies', label: 'Movies' },
  { to: '/series', label: 'Series' },
  { to: '/genres', label: 'Genres' },
]

const mobileNavItems = [
  { to: '/',                  label: 'Home',      icon: Home,     exact: true },
  { to: '/search',            label: 'Search',    icon: Search },
  { to: '/movies',            label: 'Movies',    icon: Film },
  { to: '/profile/watchlist', label: 'Watchlist', icon: Bookmark },
  { to: '/profile',           label: 'Profile',   icon: User },
]

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled,     setScrolled]     = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut(); navigate('/'); setUserMenuOpen(false)
  }

  const isActive = (to, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <>
      {/* ── Top Navbar ── */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-smooth',
        scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/8 shadow-[0_4px_32px_rgba(0,0,0,0.5)]'
          : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent border-b border-transparent'
      )}>
        <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 h-16 flex items-center gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="h-8 w-8 rounded-[10px] bg-primary flex items-center justify-center shadow-glow-xs group-hover:shadow-glow-sm transition-shadow duration-300">
              <Clapperboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden sm:block font-black text-xl tracking-tight gradient-text">Filmino</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-0.5 ml-3">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ease-smooth',
                  isActive(link.to)
                    ? 'bg-primary/15 text-primary'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto hidden md:block">
            <SearchBar />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Info icon */}
            <Link
              to="/genres"
              aria-label="Browse genres"
              className="h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Info className="h-4 w-4" />
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <Avatar src={profile?.avatar_url} name={profile?.username} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-white/90 max-w-[96px] truncate">{profile?.username}</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-card-xl z-20 overflow-hidden animate-scale-in">
                      <div className="px-4 py-3.5 border-b border-white/8">
                        <p className="text-sm font-semibold text-white leading-tight">{profile?.username}</p>
                        <p className="text-xs text-white/40 truncate mt-0.5">{profile?.email}</p>
                      </div>
                      <div className="py-1">
                        {[
                          { to: '/profile',           icon: User,     label: 'Profile' },
                          { to: '/profile/watchlist', icon: Bookmark, label: 'Watchlist' },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/8 transition-colors">
                            <Icon className="h-4 w-4 text-white/40" />
                            {label}
                          </Link>
                        ))}
                        {isAdmin() && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-medium hover:bg-primary/8 transition-colors">
                            <LayoutDashboard className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-white/8 py-1">
                        <button onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/8 transition-colors w-full text-left">
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
                  className="px-3.5 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                  Sign In
                </Link>
                <Link to="/signup"
                  className="px-3.5 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all duration-200 shadow-glow-xs hover:shadow-glow-sm">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/8 bg-black/90 backdrop-blur-2xl px-4 py-4 space-y-3 animate-fade-up">
            <SearchBar className="w-full" />
            <nav className="flex flex-col gap-0.5">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                  className={cn(
                    'px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive(link.to) ? 'bg-primary/15 text-primary' : 'hover:bg-white/8 text-white/80'
                  )}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </nav>

      {/* ── Mobile Bottom Nav ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-black/75 backdrop-blur-xl border-t border-white/8 pb-safe">
        <div className="flex items-center justify-around h-[60px]">
          {mobileNavItems.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 min-w-[52px] py-1.5 px-2 rounded-xl transition-all duration-200',
                  active ? 'text-primary' : 'text-white/45'
                )}
              >
                <div className={cn(
                  'h-6 w-6 flex items-center justify-center rounded-lg transition-all duration-200',
                  active && 'bg-primary/15 scale-110'
                )}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
