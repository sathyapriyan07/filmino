import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Clapperboard, Sun, Moon, Menu, X, User, LogOut, Bookmark, LayoutDashboard, Home, Search, Film, Tv } from 'lucide-react'
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
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/movies', label: 'Movies', icon: Film },
  { to: '/profile/watchlist', label: 'Watchlist', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setUserMenuOpen(false)
  }

  const isActive = (to, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <>
      {/* Desktop / Top Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-black text-xl flex-shrink-0 tracking-tight">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Clapperboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden sm:block gradient-text">Filmino</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1 ml-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive(link.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-auto hidden md:block">
            <SearchBar />
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
            <button
              onClick={toggle}
              className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-accent transition-colors"
                >
                  <Avatar src={profile?.avatar_url} name={profile?.username} size="sm" />
                  <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">{profile?.username}</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-2xl shadow-card-hover z-20 overflow-hidden animate-scale-in">
                      <div className="px-4 py-3 border-b border-border">
                        <div className="text-sm font-semibold">{profile?.username}</div>
                        <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
                      </div>
                      {[
                        { to: '/profile', icon: User, label: 'Profile' },
                        { to: '/profile/watchlist', icon: Bookmark, label: 'Watchlist' },
                      ].map(({ to, icon: Icon, label }) => (
                        <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                          <Icon className="h-4 w-4 text-muted-foreground" /> {label}
                        </Link>
                      ))}
                      {isAdmin() && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-primary font-medium">
                          <LayoutDashboard className="h-4 w-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-border">
                        <button onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors w-full text-left text-destructive">
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium px-3.5 py-1.5 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                  Sign In
                </Link>
                <Link to="/signup" className="text-sm font-medium px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-glow-sm hover:shadow-glow">
                  Sign Up
                </Link>
              </div>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-xl hover:bg-accent transition-colors">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search + nav dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-3 space-y-2 animate-fade-in">
            <SearchBar className="w-full" />
            <div className="flex flex-col gap-1 pt-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                  className={cn('px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive(link.to) ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                  )}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/60 bg-background/90 backdrop-blur-2xl pb-safe">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5 transition-transform duration-200', active && 'scale-110')} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
