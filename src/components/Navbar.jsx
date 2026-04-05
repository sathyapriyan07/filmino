import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Film, Sun, Moon, Menu, X, User, LogOut, Settings, Bookmark, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import SearchBar from './SearchBar'
import { cn } from '../utils/helpers'

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

  const navLinks = [
    { to: '/movies', label: 'Movies' },
    { to: '/series', label: 'Series' },
    { to: '/genres', label: 'Genres' },
  ]

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg flex-shrink-0">
          <Film className="h-6 w-6 text-primary" />
          <span className="hidden sm:block">MovieDB</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith(link.to)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto">
          <SearchBar />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-accent transition-colors">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-accent transition-colors"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium">{profile?.username}</span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <Link to="/profile/watchlist" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                      <Bookmark className="h-4 w-4" /> Watchlist
                    </Link>
                    {isAdmin() && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-primary">
                        <LayoutDashboard className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <hr className="border-border" />
                    <button onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors w-full text-left text-destructive">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="text-sm font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
