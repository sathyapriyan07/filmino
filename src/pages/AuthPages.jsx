import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Film, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabase'
import { Button, Input } from '../components/ui'

function AuthBackground() {
  const [posters, setPosters] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('movies').select('poster').not('poster', 'is', null).limit(20)
      setPosters((data || []).map(m => m.poster))
    }
    load()
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="grid grid-cols-5 gap-1 opacity-20 scale-110 rotate-3 h-full">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-muted overflow-hidden rounded">
            {posters[i % posters.length] && (
              <img src={posters[i % posters.length]} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
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
    <div className="min-h-screen flex items-center justify-center relative">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Film className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">MovieDB</span>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-center text-sm mb-6">Sign in to your account</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
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
    <div className="min-h-screen flex items-center justify-center relative">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your account is pending admin approval. You'll be able to sign in once approved.
          </p>
          <Link to="/login" className="text-primary hover:underline">Back to Sign In</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Film className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">MovieDB</span>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Create account</h1>
          <p className="text-muted-foreground text-center text-sm mb-6">Join MovieDB today</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Username</label>
              <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="johndoe" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
