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
   POSTER BACKGROUND
   Mobile: fills top section (45vh).
   Desktop: fills entire left panel.
   Two separate column counts keep mobile tight (3 cols)
   and desktop lush (6 cols).
───────────────────────────────────────────────────────── */
function PosterBackground({ className = '' }) {
  const [posters, setPosters] = useState([])

  useEffect(() => {
    supabase
      .from('movies')
      .select('poster')
      .not('poster', 'is', null)
      .order('popularity', { ascending: false })
      .limit(54)
      .then(({ data }) => setPosters((data || []).map(d => d.poster)))
  }, [])

  /* stagger heights so adjacent columns feel organic */
  const colOffsets = ['mt-0', '-mt-8', 'mt-4', '-mt-12', 'mt-2', '-mt-6']

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {/* ── Poster grid ── */}
      <div className="absolute inset-[-10%] flex gap-2 auth-poster-drift">
        {[0, 1, 2, 3, 4, 5].map(col => (
          <div
            key={col}
            className={cn('flex flex-col gap-2 flex-1', colOffsets[col])}
          >
            {Array.from({ length: 9 }).map((_, row) => {
              const idx = col * 9 + row
              const src = posters.length ? posters[idx % posters.length] : null
              return (
                <div
                  key={row}
                  className="aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.04] flex-shrink-0"
                >
                  {src && (
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover opacity-[0.75]"
                    />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Overlay stack ── */}
      {/* light base dark — posters stay clearly visible */}
      <div className="absolute inset-0 bg-black/25" />
      {/* bottom fade — only last 30% fades to dark for form readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" style={{ top: '55%' }} />
      {/* subtle top vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" style={{ bottom: '70%' }} />
      {/* desktop: right-side fade so form panel has clean bg */}
      <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-transparent via-transparent to-black/90" style={{ left: '55%' }} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   FLOATING STATS  (desktop left panel only)
───────────────────────────────────────────────────────── */
function FloatingStats() {
  const items = [
    { icon: Film, value: '10K+', label: 'Movies tracked' },
    { icon: Tv,   value: '3K+',  label: 'Series catalogued' },
    { icon: Star, value: '50K+', label: 'Reviews written' },
  ]
  return (
    <div className="flex flex-col gap-3 mt-8">
      {items.map(({ icon: Icon, value, label }, i) => (
        <div
          key={label}
          className="flex items-center gap-3 auth-stat-item"
          style={{ animationDelay: `${320 + i * 90}ms` }}
        >
          <div className="h-8 w-8 rounded-lg bg-white/[0.08] border border-white/[0.10] flex items-center justify-center flex-shrink-0">
            <Icon className="h-3.5 w-3.5 text-white/55" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">{value}</p>
            <p className="text-white/38 text-xs mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   INPUT FIELD  (reusable)
───────────────────────────────────────────────────────── */
export function InputField({ icon: Icon, error, className, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/28 pointer-events-none z-10" />
      )}
      <input
        className={cn(
          'auth-input w-full h-12 rounded-xl text-sm text-white',
          'bg-white/[0.06] border border-white/[0.10]',
          'placeholder:text-white/22',
          Icon ? 'pl-10 pr-4' : 'px-4',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/40 focus:bg-white/[0.10]',
          'transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          error && 'border-red-500/50 focus:ring-red-500/40 focus:border-red-500/40',
          className
        )}
        {...props}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   PASSWORD FIELD  (show/hide toggle)
───────────────────────────────────────────────────────── */
function PasswordField({ error, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/28 pointer-events-none z-10" />
      <input
        type={show ? 'text' : 'password'}
        className={cn(
          'auth-input w-full h-12 rounded-xl text-sm text-white',
          'bg-white/[0.06] border border-white/[0.10]',
          'placeholder:text-white/22',
          'pl-10 pr-11',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/40 focus:bg-white/[0.10]',
          'transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          error && 'border-red-500/50 focus:ring-red-500/40 focus:border-red-500/40'
        )}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(v => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-lg text-white/28 hover:text-white/65 hover:bg-white/[0.07] transition-all duration-150"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   FIELD WRAPPER  (label + input + error)
───────────────────────────────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-[0.09em]">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-400/85 flex items-center gap-1 pl-0.5">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   PRIMARY BUTTON  (gradient + glow)
───────────────────────────────────────────────────────── */
export function PrimaryButton({ loading, children, className, ...props }) {
  return (
    <button
      disabled={loading}
      className={cn(
        'relative w-full h-12 min-h-[44px] rounded-xl',
        'font-semibold text-sm text-white',
        'flex items-center justify-center gap-2',
        /* gradient */
        'bg-gradient-to-r from-indigo-500 to-purple-500',
        /* glow */
        'shadow-[0_0_22px_rgba(99,102,241,0.38)]',
        /* hover */
        'hover:brightness-110 hover:scale-[1.013] hover:shadow-[0_0_30px_rgba(99,102,241,0.55)]',
        /* active */
        'active:scale-[0.984]',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-black/40',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100 disabled:shadow-none',
        className
      )}
      {...props}
    >
      {loading
        ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Loading…</span></>
        : children
      }
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
      className="flex items-start gap-2.5 bg-red-500/[0.11] border border-red-500/22 text-red-300 text-xs rounded-xl px-3.5 py-3 animate-fade-up mb-5"
    >
      <span className="flex-shrink-0 mt-px" aria-hidden>⚠</span>
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
      <span className="text-[10px] font-semibold text-white/18 uppercase tracking-[0.14em]">or</span>
      <div className="flex-1 h-px bg-white/[0.07]" />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   PASSWORD STRENGTH
───────────────────────────────────────────────────────── */
function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const bar   = ['bg-red-500',  'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400']
  const text  = ['text-red-400','text-orange-400','text-yellow-400','text-emerald-400']
  const label = ['Weak',        'Fair',           'Good',          'Strong']

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i < score ? bar[score-1] : 'bg-white/[0.08]')} />
        ))}
      </div>
      {score > 0 && <p className={cn('text-[11px] font-medium pl-0.5', text[score-1])}>{label[score-1]} password</p>}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   AUTH MOBILE LAYOUT
   ┌──────────────────────────────┐
   │  PosterBackground  (45vh)    │  ← mobile top
   ├──────────────────────────────┤
   │  Form sheet  (rounded-t-3xl) │  ← mobile bottom
   └──────────────────────────────┘
   On md+ switches to side-by-side split.
───────────────────────────────────────────────────────── */
export function AuthMobileLayout({ children }) {
  return (
    <div className="h-screen bg-[#07070f] flex flex-col md:flex-row overflow-hidden">

      {/* ── POSTER SECTION ── */}
      {/* Mobile: flex-1 fills remaining space above the form sheet */}
      {/* Desktop: full-height left panel */}
      <div className="relative flex-1 md:flex-1 overflow-hidden">
        <PosterBackground />

        {/* Desktop branding */}
        <div className="hidden md:flex relative z-10 flex-col justify-between h-full p-10 lg:p-14">
          <div className="auth-brand-item" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_18px_rgba(99,102,241,0.50)]">
                <Clapperboard className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">Filmino</span>
            </div>
          </div>
          <div className="max-w-[280px]">
            <div className="auth-brand-item" style={{ animationDelay: '180ms' }}>
              <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                Your personal<br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  cinema
                </span>{' '}awaits.
              </h2>
              <p className="text-white/40 text-sm mt-3 leading-relaxed">
                Discover, track, and review every movie and series you love.
              </p>
            </div>
            <FloatingStats />
          </div>
        </div>

        {/* Mobile logo — centred over poster */}
        <div className="md:hidden absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="auth-brand-item" style={{ animationDelay: '0ms' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.55)]">
                <Clapperboard className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight drop-shadow-lg">Filmino</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FORM SECTION ── */}
      {/* Mobile: fixed height, rounded-t-3xl sheet, NO scroll */}
      {/* Desktop: fixed-width right panel, full height */}
      <div
        className={cn(
          'relative z-10 flex-shrink-0',
          /* mobile: fixed height sheet — sized to fit all form content */
          'h-[58vh] md:h-auto',
          /* mobile: rounded top sheet */
          'rounded-t-3xl md:rounded-none',
          /* desktop width */
          'w-full md:w-[440px] lg:w-[480px]',
          /* glass */
          'bg-[#0c0c1a]/96 backdrop-blur-2xl',
          /* desktop: left border */
          'md:border-l md:border-white/[0.06]',
          'flex flex-col',
        )}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-3 pb-0 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/[0.15]" />
        </div>

        {/* Form content — centred, NO overflow scroll */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 md:px-10 lg:px-12 py-5 md:py-12 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   AUTH FORM WRAPPER  (stagger container)
───────────────────────────────────────────────────────── */
function AuthForm({ children }) {
  return (
    <div className="w-full max-w-sm mx-auto md:max-w-none auth-form-enter">
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
  const navigate = useNavigate()
  const emailRef = useRef(null)

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
    <AuthMobileLayout>
      <AuthForm>
        {/* Heading */}
        <div className="mb-4 auth-card-item" style={{ animationDelay: '60ms' }}>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Welcome back
          </h1>
          <p className="text-white/38 text-sm mt-1">Sign in to continue to Filmino</p>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-3 auth-card-item" style={{ animationDelay: '130ms' }}>

            <Field label="Email address">
              <InputField
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
              <PasswordField
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </Field>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.06] accent-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-white/32 group-hover:text-white/52 transition-colors">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-xs text-white/32 hover:text-indigo-400 transition-colors duration-200 min-h-[44px] flex items-center"
              >
                Forgot password?
              </button>
            </div>

            <div>
              <PrimaryButton loading={loading} type="submit">
                {!loading && <>Sign In <ArrowRight className="h-4 w-4" /></>}
              </PrimaryButton>
            </div>
          </div>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[10px] font-semibold text-white/18 uppercase tracking-[0.14em]">or</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <p className="text-center text-sm text-white/32 auth-card-item" style={{ animationDelay: '220ms' }}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors duration-200 hover:underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </AuthForm>
    </AuthMobileLayout>
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
    return !Object.keys(e).length
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

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  /* ── Success state ── */
  if (success) {
    return (
      <AuthMobileLayout>
        <div className="w-full max-w-sm mx-auto md:max-w-none text-center auth-form-enter">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-emerald-500/12 border border-emerald-500/22 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.18)]">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Account created!</h2>
          <p className="text-white/38 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            Your account is pending admin approval. You'll be able to sign in once approved.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full h-12 min-h-[44px] rounded-xl border border-white/[0.12] text-white/55 text-sm font-medium hover:bg-white/[0.05] hover:text-white hover:border-white/20 transition-all duration-200"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthMobileLayout>
    )
  }

  return (
    <AuthMobileLayout>
      <AuthForm>
        {/* Heading */}
        <div className="mb-4 auth-card-item" style={{ animationDelay: '60ms' }}>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Create account
          </h1>
          <p className="text-white/38 text-sm mt-1">Join Filmino and start tracking</p>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-3 auth-card-item" style={{ animationDelay: '130ms' }}>

            <Field label="Username" error={errors.username}>
              <InputField
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
              <InputField
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
              <PasswordField
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                error={errors.password}
              />
            </Field>

            {form.password.length > 0 && <PasswordStrength password={form.password} />}

            <p className="text-[11px] text-white/18 leading-none">
              By creating an account you agree to our{' '}
              <span className="text-white/32 hover:text-indigo-400 cursor-pointer transition-colors">Terms</span>
              {' '}and{' '}
              <span className="text-white/32 hover:text-indigo-400 cursor-pointer transition-colors">Privacy Policy</span>.
            </p>

            <div>
              <PrimaryButton loading={loading} type="submit">
                {!loading && <>Create Account <ArrowRight className="h-4 w-4" /></>}
              </PrimaryButton>
            </div>
          </div>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[10px] font-semibold text-white/18 uppercase tracking-[0.14em]">or</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <p className="text-center text-sm text-white/32 auth-card-item" style={{ animationDelay: '220ms' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors duration-200 hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </AuthForm>
    </AuthMobileLayout>
  )
}
