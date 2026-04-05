import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Clapperboard, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabase'
import { Button, Input } from '../components/ui'
import { cn } from '../utils/helpers'

function AuthBackground() {
  const [posters, setPosters] = useState([])
  useEffect(() => {
    supabase.from('movies').select('poster').not('poster', 'is', null).limit(30)
      .then(({ data }) => setPosters((data || []).map(m => m.poster)))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 opacity-30 dark:opacity-20 scale-110 -rotate-3 absolute inset-0 p-2">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl overflow-hidden bg-muted">
            {posters[i % Math.max(posters.length, 1)] && (
              <img src={posters[i % posters.length]} alt="" className="w-full h-full object-cover" loading="lazy" />
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/95 backdrop-blur-sm" />
    </div>
  )
}

function AuthCard({ children }) {
  return (
    <div className="relative z-10 w-full max-w-md px-4 mx-auto">
      <div className="bg-card/95 backdrop-blur-2xl border border-border/80 rounded-3xl p-8 shadow-card-hover animate-scale-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
            <Clapperboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-black gradient-text tracking-tight">Filmino</span>
        </div>
        {children}
      </div>
    </div>
  )
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/') }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative py-12">
      <AuthBackground />
      <AuthCard>
        <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
        <p className="text-muted-foreground text-center text-sm mb-7">Sign in to your account</p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-3.5 mb-5 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" className="pr-11" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
            {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">Sign up</Link>
        </p>
      </AuthCard>
    </div>
  )
}

export function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.username)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center relative py-12">
      <AuthBackground />
      <AuthCard>
        <div className="text-center">
          <div className="text-6xl mb-5">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
          <p className="text-muted-foreground text-sm mb-7 leading-relaxed">
            Your account is pending admin approval.<br />You'll be able to sign in once approved.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full">Back to Sign In</Button>
          </Link>
        </div>
      </AuthCard>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center relative py-12">
      <AuthBackground />
      <AuthCard>
        <h1 className="text-2xl font-bold text-center mb-1">Create account</h1>
        <p className="text-muted-foreground text-center text-sm mb-7">Join Filmino today</p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-3.5 mb-5 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Username</label>
            <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="johndoe" required autoComplete="username" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required minLength={6} className="pr-11" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
            {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">Sign in</Link>
        </p>
      </AuthCard>
    </div>
  )
}
