import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Clapperboard, ArrowRight, Loader2, CheckCircle2, User, Mail, Lock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabase'
import { cn } from '../utils/helpers'

/* ═══════════════════════════════════════════════════════
   POSTER COLLAGE — fetches real posters from DB
═══════════════════════════════════════════════════════ */
function PosterCollage() {
  const [posters, setPosters] = useState([])

  useEffect(() => {
    supabase
      .from('movies')
      .select('poster')
      .not('poster', 'is', null)
      .order('popularity', { ascending: false })
      .limit(40)
      .then(({ data }) => setPosters((data || []).map(d => d.poster)))
  }, [])

  const count = 36
  const cols  = 6

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Rotated poster grid */}
      <div
        className="absolute inset-[-15%] grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          transform: 'rotate(-6deg) scale(1.15)',
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 shadow-lg"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            {posters.length > 0 && (
              <img
                src={posters[i % posters.length]}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover opacity-60"
              />
            )}
          </div>
        ))}
      </div>

      {/* Dark vignette over the grid */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Left-to-right gradient for desktop split */}
      <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-black/10 via-black/40 to-black/90" />
      {/* Bottom fade into page bg */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   AUTH INPUT — with icon slot and error state
═══════════════════════════════════════════════════════ */
function AuthInput({ icon: Icon, error, className, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35 pointer-events-none" />
      )}
      <input
        className={cn(
          'w-full h-12 md:h-13 rounded-xl text-sm text-white',
          'bg-white/8 border border-white/12',
          'placeholder:text-white/30',
          Icon ? 'pl-11 pr-4' : 'px-4',
          'focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/50 focus:bg-white/12',
          'transition-all duration-200 ease-out',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500/60 focus:ring-red-500/50',
          className
        )}
        {...props}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   PASSWORD INPUT — with show/hide toggle
═══════════════════════════════════════════════════════ */
function PasswordInput({ error, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35 pointer-events-none" />
      <input
        type={show ? 'text' : 'password'}
        className={cn(
          'w-full h-12 md:h-13 rounded-xl text-sm text-white',
          'bg-white/8 border border-white/12',
          'placeholder:text-white/30',
          'pl-11 pr-12',
          'focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/50 focus:bg-white/12',
          'transition-all duration-200 ease-out',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500/60 focus:ring-red-500/50'
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-white/40 hover:text-white/80 transition-colors duration-150"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   AUTH BUTTON — primary CTA
═══════════════════════════════════════════════════════ */
function AuthButton({ loading, children, ...props }) {
  return (
    <button
      className={cn(
        'w-full h-12 md:h-13 rounded-xl font-semibold text-sm text-white',
        'bg-primary shadow-[0_0_20px_rgba(99,102,241,0.45)]',
        'flex items-center justify-center gap-2.5',
        'transition-all duration-200 ease-out',
        'hover:brightness-110 hover:scale-[1.015] hover:shadow-[0_0_28px_rgba(99,102,241,0.60)]',
        'active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100',
        'focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-transparent'
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{typeof children === 'string' ? `${children}…` : children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════
   ERROR BANNER
═══════════════════════════════════════════════════════ */
function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 bg-red-500/15 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 animate-fade-up">
      <span className="mt-0.5 flex-shrink-0">⚠</span>
      <span>{message}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   FIELD WRAPPER — label + input + optional error
═══════════════════════════════════════════════════════ */
function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-white/55 uppercase tracking-widest pl-0.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 pl-0.5">{error}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   AUTH LAYOUT — full-screen split
═══════════════════════════════════════════════════════ */
function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-black flex">
      {/* ── Left: Poster collage (desktop only) ── */}
      <div className="hidden md:block relative flex-1 overflow-hidden">
        <PosterCollage />
        {/* Branding overlay on left */}
        <div className="absolute inset-0 flex flex-col justify-end p-12 z-10">
          <div className="animate-fade-up" style={{ animationDelay: '200ms', opacity: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-[10px] bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                <Clapperboard className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">Filmino</span>
            </div>
            <p className="text-white/50 text-sm max-w-xs leading-relaxed">
              Your personal cinema. Discover, track, and review movies and series you love.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="relative w-full md:w-[440px] lg:w-[480px] flex-shrink-0 flex flex-col">
        {/* Mobile: poster bg behind form */}
        <div className="md:hidden absolute inset-0">
          <PosterCollage />
        </div>

        {/* Form scroll container */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-10 lg:px-12 py-12 bg-black/85 md:bg-black/92 backdrop-blur-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   AUTH CARD — glassmorphism container
═══════════════════════════════════════════════════════ */
function AuthCard({ children }) {
  return (
    <div className="w-full max-w-sm mx-auto md:max-w-none animate-fade-up">
      {/* Logo — mobile only (desktop shows in left panel) */}
      <div className="flex items-center gap-3 mb-10 md:mb-8">
        <div className="h-9 w-9 rounded-[9px] bg-primary flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.45)] md:hidden">
          <Clapperboard className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-xl font-black text-white tracking-tight md:hidden">Filmino</span>
        {/* Desktop: just a subtle divider line at top */}
        <div className="hidden md:block h-px flex-1 bg-white/8" />
      </div>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════════════ */
export function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { signIn, user } = useAuthStore()
  const navigate  = useNavigate()
  const emailRef  = useRef(null)

  useEffect(() => { if (user) navigate('/') }, [user])
  useEffect(() => { emailRef.current?.focus() }, [])

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
    <AuthLayout>
      <AuthCard>
        {/* Heading */}
        <div className="mb-8" style={{ animationDelay: '80ms' }}>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1.5">
            Welcome back
          </h1>
          <p className="text-white/45 text-sm">Sign in to continue to Filmino</p>
        </div>

        {/* Error */}
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <AuthInput
              ref={emailRef}
              icon={Mail}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </Field>

          <Field label="Password">
            <PasswordInput
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </Field>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-white/8 accent-primary cursor-pointer"
              />
              <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">Remember me</span>
            </label>
            <button
              type="button"
              className="text-xs text-white/40 hover:text-primary transition-colors duration-200"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <AuthButton loading={loading} type="submit">
              {loading ? 'Signing in' : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </AuthButton>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-white/25 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-white/40">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200 hover:underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}

/* ═══════════════════════════════════════════════════════
   SIGNUP PAGE
═══════════════════════════════════════════════════════ */
export function SignupPage() {
  const [form,    setForm]    = useState({ username: '', email: '', password: '' })
  const [errors,  setErrors]  = useState({})
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuthStore()
  const usernameRef = useRef(null)

  useEffect(() => { usernameRef.current?.focus() }, [])

  const validate = () => {
    const e = {}
    if (!form.username.trim())          e.username = 'Username is required'
    else if (form.username.length < 3)  e.username = 'At least 3 characters'
    if (!form.email.trim())             e.email    = 'Email is required'
    if (!form.password)                 e.password = 'Password is required'
    else if (form.password.length < 6)  e.password = 'At least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
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

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }))
  }

  /* ── Success state ── */
  if (success) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm mx-auto md:max-w-none animate-fade-up text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
            Account created!
          </h2>
          <p className="text-white/45 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            Your account is pending admin approval. You'll be able to sign in once it's approved.
          </p>
          <Link
            to="/login"
            className={cn(
              'inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl',
              'border border-white/15 text-white/70 text-sm font-medium',
              'hover:bg-white/8 hover:text-white transition-all duration-200'
            )}
          >
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthCard>
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1.5">
            Create account
          </h1>
          <p className="text-white/45 text-sm">Join Filmino and start tracking</p>
        </div>

        {/* Error */}
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Username" error={errors.username}>
            <AuthInput
              ref={usernameRef}
              icon={User}
              value={form.username}
              onChange={set('username')}
              placeholder="johndoe"
              required
              autoComplete="username"
              error={errors.username}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <AuthInput
              icon={Mail}
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              required
              autoComplete="email"
              error={errors.email}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <PasswordInput
              value={form.password}
              onChange={set('password')}
              placeholder="Min. 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              error={errors.password}
            />
          </Field>

          {/* Password strength hint */}
          {form.password.length > 0 && (
            <PasswordStrength password={form.password} />
          )}

          {/* Terms */}
          <p className="text-xs text-white/25 leading-relaxed pt-1">
            By creating an account you agree to our{' '}
            <span className="text-white/40 hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
            {' '}and{' '}
            <span className="text-white/40 hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>.
          </p>

          {/* Submit */}
          <div className="pt-1">
            <AuthButton loading={loading} type="submit">
              {loading ? 'Creating account' : (
                <>Create Account <ArrowRight className="h-4 w-4" /></>
              )}
            </AuthButton>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-white/25 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm text-white/40">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200 hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}

/* ═══════════════════════════════════════════════════════
   PASSWORD STRENGTH INDICATOR
═══════════════════════════════════════════════════════ */
function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score  = checks.filter(Boolean).length
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className="space-y-1.5 animate-fade-up">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < score ? colors[score - 1] : 'bg-white/10'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs pl-0.5 transition-colors', score > 0 ? colors[score-1].replace('bg-','text-') : 'text-white/30')}>
        {score > 0 ? labels[score - 1] : ''}
      </p>
    </div>
  )
}
