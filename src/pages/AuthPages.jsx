import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Clapperboard, ArrowRight, Loader2,
  CheckCircle2, User, Mail, Lock, Film, Star, Tv,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../services/supabase'
import { cn } from '../utils/helpers'

/* ─────────────────────────────────────────────────────────
   POSTER COLLAGE
   Fetches real posters; renders a tilted grid behind the
   left branding panel. Reduced opacity + stronger overlays
   so text is always readable.
───────────────────────────────────────────────────────── */
function PosterCollage() {
  const [posters, setPosters] = useState([])

  useEffect(() => {
    supabase
      .from('movies')
      .select('poster')
      .not('poster', 'is', null)
      .order('popularity', { ascending: false })
      .limit(48)
      .then(({ data }) => setPosters((data || []).map(d => d.poster)))
  }, [])

  const COLS  = 6
  const COUNT = 42

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Tilted poster grid */}
      <div
        className="absolute inset-[-20%]"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: '8px',
          transform: 'rotate(-8deg) scale(1.25)',
        }}
      >
        {Array.from({ length: COUNT }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.04]"
          >
            {posters[i % Math.max(posters.length, 1)] && (
              <img
                src={posters[i % posters.length]}
                alt=""
                loading="lazy"
                decoding="async"
                /* ↓ reduced from 0.60 → 0.35 so text is legible */
                className="w-full h-full object-cover opacity-[0.35] transition-opacity duration-700"
              />
            )}
          </div>
        ))}
      </div>

      {/* Layer stack — darkens the grid progressively */}
      {/* Base dark fill */}
      <div className="absolute inset-0 bg-black/70" />
      {/* Radial vignette — darkest at edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 60% 50%, transparent 20%, rgba(0,0,0,0.55) 80%)',
        }}
      />
      {/* Left-to-right split: left stays visible, right fades to near-black */}
      <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-black/20 via-black/50 to-black/95" />
      {/* Top + bottom fades */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   FLOATING STATS — decorative badges on the left panel
───────────────────────────────────────────────────────── */
function FloatingStats() {
  const stats = [
    { icon: Film,  label: 'Movies tracked',  value: '10K+' },
    { icon: Tv,    label: 'Series catalogued', value: '3K+' },
    { icon: Star,  label: 'Reviews written',  value: '50K+' },
  ]
  return (
    <div className="flex flex-col gap-3 mt-8">
      {stats.map(({ icon: Icon, label, value }, i) => (
        <div
          key={label}
          className="flex items-center gap-3 auth-stat-item"
          style={{ animationDelay: `${300 + i * 100}ms` }}
        >
          <div className="h-8 w-8 rounded-lg bg-white/[0.08] border border-white/[0.10] flex items-center justify-center flex-shrink-0">
            <Icon className="h-3.5 w-3.5 text-white/60" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">{value}</div>
            <div className="text-white/40 text-xs mt-0.5">{label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   AUTH INPUT — icon + error state + autofill fix
───────────────────────────────────────────────────────── */
const AuthInput = ({ icon: Icon, error, className, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none z-10" />
    )}
    <input
      className={cn(
        'auth-input w-full h-12 rounded-xl text-sm text-white',
        'bg-white/[0.07] border border-white/[0.10]',
        'placeholder:text-white/25',
        Icon ? 'pl-10 pr-4' : 'px-4',
        'focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 focus:bg-white/[0.11]',
        'transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        error && 'border-red-500/50 focus:ring-red-500/40 focus:border-red-500/40',
        className
      )}
      {...props}
    />
  </div>
)

/* ─────────────────────────────────────────────────────────
   PASSWORD INPUT — show / hide toggle
───────────────────────────────────────────────────────── */
function PasswordInput({ error, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none z-10" />
      <input
        type={show ? 'text' : 'password'}
        className={cn(
          'auth-input w-full h-12 rounded-xl text-sm text-white',
          'bg-white/[0.07] border border-white/[0.10]',
          'placeholder:text-white/25',
          'pl-10 pr-11',
          'focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 focus:bg-white/[0.11]',
          'transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          error && 'border-red-500/50 focus:ring-red-500/40 focus:border-red-500/40'
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-all duration-150"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   FIELD WRAPPER — label + input + inline error
───────────────────────────────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-[0.08em]">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-400/90 flex items-center gap-1 pl-0.5">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   AUTH BUTTON — primary CTA with glow + loading state
───────────────────────────────────────────────────────── */
function AuthButton({ loading, children, ...props }) {
  return (
    <button
      disabled={loading}
      className={cn(
        'relative w-full h-12 rounded-xl font-semibold text-sm text-white',
        'bg-primary',
        'flex items-center justify-center gap-2',
        'shadow-[0_0_24px_rgba(99,102,241,0.40)]',
        'hover:brightness-110 hover:shadow-[0_0_32px_rgba(99,102,241,0.60)] hover:scale-[1.012]',
        'active:scale-[0.985]',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-black/50',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100 disabled:shadow-none',
        'min-h-[44px]'
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{typeof children === 'string' ? `${children}…` : 'Loading…'}</span>
        </>
      ) : children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────
   ERROR BANNER
───────────────────────────────────────────────────────── */
function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 bg-red-500/[0.12] border border-red-500/25 text-red-300 text-xs rounded-xl px-3.5 py-3 animate-fade-up"
    >
      <span className="flex-shrink-0 mt-px">⚠</span>
      <span className="leading-relaxed">{message}</span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   DIVIDER
───────────────────────────────────────────────────────── */
function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-white/[0.07]" />
      <span className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em]">or</span>
      <div className="flex-1 h-px bg-white/[0.07]" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   AUTH LAYOUT — full-screen cinematic split
───────────────────────────────────────────────────────── */
function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#080810] flex overflow-hidden">

      {/* ── LEFT: Branding panel (desktop only) ── */}
      <div className="hidden md:flex relative flex-1 flex-col overflow-hidden">
        <PosterCollage />

        {/* Branding content — sits above all overlays */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 lg:p-14">
          {/* Top logo */}
          <div className="auth-brand-item" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[10px] bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.50)]">
                <Clapperboard className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">Filmino</span>
            </div>
          </div>

          {/* Bottom tagline + stats */}
          <div className="max-w-xs">
            <div className="auth-brand-item" style={{ animationDelay: '200ms' }}>
              <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                Your personal<br />
                <span className="text-primary">cinema</span> awaits.
              </h2>
              <p className="text-white/45 text-sm mt-3 leading-relaxed">
                Discover, track, and review every movie and series you love — all in one place.
              </p>
            </div>
            <FloatingStats />
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="relative w-full md:w-[440px] lg:w-[480px] flex-shrink-0 flex flex-col">
        {/* Mobile: poster bg */}
        <div className="md:hidden absolute inset-0">
          <PosterCollage />
        </div>

        {/* Glass panel */}
        <div
          className={cn(
            'relative z-10 flex-1 flex flex-col justify-center',
            'px-6 sm:px-10 md:px-10 lg:px-12 py-10',
            /* desktop: solid dark panel */
            'md:bg-[#0d0d18]/95 md:backdrop-blur-2xl md:border-l md:border-white/[0.06]',
            /* mobile: glass over poster */
            'bg-black/80 backdrop-blur-2xl',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   AUTH CARD — staggered entrance animation wrapper
───────────────────────────────────────────────────────── */
function AuthCard({ children }) {
  return (
    <div className="w-full max-w-sm mx-auto md:max-w-none">
      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 mb-8 md:hidden auth-card-item" style={{ animationDelay: '0ms' }}>
        <div className="h-8 w-8 rounded-[8px] bg-primary flex items-center justify-center shadow-[0_0_14px_rgba(99,102,241,0.45)]">
          <Clapperboard className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-black text-white tracking-tight">Filmino</span>
      </div>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   PASSWORD STRENGTH
───────────────────────────────────────────────────────── */
function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score  = checks.filter(Boolean).length
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const textColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-emerald-400']

  return (
    <div className="space-y-1.5 animate-fade-up">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < score ? colors[score - 1] : 'bg-white/[0.08]'
            )}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={cn('text-[11px] pl-0.5 font-medium', textColors[score - 1])}>
          {labels[score - 1]} password
        </p>
      )}
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
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        {/* Heading */}
        <div className="mb-7 auth-card-item" style={{ animationDelay: '60ms' }}>
          <h1 className="text-2xl md:text-[1.75rem] font-black text-white tracking-tight leading-tight">
            Welcome back
          </h1>
          <p className="text-white/40 text-sm mt-1.5">Sign in to continue to Filmino</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5">
            <ErrorBanner message={error} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 auth-card-item" style={{ animationDelay: '120ms' }}>
            <Field label="Email address">
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
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </Field>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.07] accent-primary cursor-pointer"
                />
                <span className="text-xs text-white/35 group-hover:text-white/55 transition-colors">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-xs text-white/35 hover:text-primary transition-colors duration-200 min-h-[44px] flex items-center"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <AuthButton loading={loading} type="submit">
                {!loading && (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </AuthButton>
            </div>
          </div>
        </form>

        <Divider />

        {/* Sign up link */}
        <p className="text-center text-sm text-white/35 auth-card-item" style={{ animationDelay: '200ms' }}>
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
    if (!form.username.trim())         e.username = 'Username is required'
    else if (form.username.length < 3) e.username = 'At least 3 characters'
    if (!form.email.trim())            e.email    = 'Email is required'
    if (!form.password)                e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'At least 6 characters'
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

  if (success) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm mx-auto md:max-w-none text-center animate-fade-up">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.20)]">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
            Account created!
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            Your account is pending admin approval. You'll be able to sign in once it's approved.
          </p>
          <Link
            to="/login"
            className={cn(
              'inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl min-h-[44px]',
              'border border-white/[0.12] text-white/60 text-sm font-medium',
              'hover:bg-white/[0.06] hover:text-white hover:border-white/20 transition-all duration-200'
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
        <div className="mb-7 auth-card-item" style={{ animationDelay: '60ms' }}>
          <h1 className="text-2xl md:text-[1.75rem] font-black text-white tracking-tight leading-tight">
            Create account
          </h1>
          <p className="text-white/40 text-sm mt-1.5">Join Filmino and start tracking</p>
        </div>

        {error && (
          <div className="mb-5">
            <ErrorBanner message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 auth-card-item" style={{ animationDelay: '120ms' }}>
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

            <Field label="Email address" error={errors.email}>
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

            {form.password.length > 0 && (
              <PasswordStrength password={form.password} />
            )}

            <p className="text-[11px] text-white/20 leading-relaxed pt-0.5">
              By creating an account you agree to our{' '}
              <span className="text-white/35 hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
              {' '}and{' '}
              <span className="text-white/35 hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>.
            </p>

            <div className="pt-1">
              <AuthButton loading={loading} type="submit">
                {!loading && (
                  <>Create Account <ArrowRight className="h-4 w-4" /></>
                )}
              </AuthButton>
            </div>
          </div>
        </form>

        <Divider />

        <p className="text-center text-sm text-white/35 auth-card-item" style={{ animationDelay: '200ms' }}>
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
