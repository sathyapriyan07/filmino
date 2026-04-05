import { cn } from '../../utils/helpers'

/* ─────────────────────────────────────────
   BUTTON
───────────────────────────────────────── */
export function Button({ className, variant = 'default', size = 'default', children, ...props }) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-smooth focus-ring disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] select-none'

  const variants = {
    default:     'bg-primary text-primary-foreground hover:brightness-110 shadow-glow-xs hover:shadow-glow-sm rounded-xl',
    destructive: 'bg-destructive text-destructive-foreground hover:brightness-110 rounded-xl',
    outline:     'border border-border/80 bg-transparent hover:bg-accent text-foreground rounded-xl',
    secondary:   'bg-secondary/70 text-secondary-foreground hover:bg-secondary rounded-xl',
    ghost:       'bg-transparent hover:bg-accent text-foreground rounded-xl',
    glass:       'glass text-white hover:bg-white/15 rounded-xl',
    'glass-dark':'glass-dark text-white hover:bg-black/50 rounded-xl',
    link:        'text-primary hover:text-primary/80 underline-offset-4 hover:underline p-0 h-auto rounded-none',
  }

  const sizes = {
    xs:       'h-7 px-3 text-xs gap-1.5',
    sm:       'h-8 px-3.5 text-xs gap-1.5',
    default:  'h-10 px-5 text-sm gap-2',
    lg:       'h-11 px-7 text-sm gap-2',
    xl:       'h-13 px-9 text-base gap-2.5',
    icon:     'h-10 w-10',
    'icon-sm':'h-8 w-8',
    'icon-lg':'h-11 w-11',
  }

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────
   INPUT
───────────────────────────────────────── */
export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-xl border border-input bg-background/80 px-4 py-2 text-sm',
        'placeholder:text-muted-foreground/60',
        'focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-transparent focus:bg-background',
        'transition-all duration-200 ease-smooth',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

/* ─────────────────────────────────────────
   TEXTAREA
───────────────────────────────────────── */
export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[88px] w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-sm',
        'placeholder:text-muted-foreground/60',
        'focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-transparent focus:bg-background',
        'transition-all duration-200 ease-smooth resize-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

/* ─────────────────────────────────────────
   BADGE
───────────────────────────────────────── */
export function Badge({ className, variant = 'default', children }) {
  const variants = {
    default:     'bg-primary/12 text-primary',
    secondary:   'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive/12 text-destructive',
    outline:     'border border-border/80 text-foreground',
    success:     'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
    warning:     'bg-amber-500/12 text-amber-600 dark:text-amber-400',
    glass:       'glass text-white',
    muted:       'bg-muted text-muted-foreground',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}

/* ─────────────────────────────────────────
   CARD
───────────────────────────────────────── */
export function Card({ className, children, hover = false, elevated = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-card text-card-foreground',
        !elevated && 'border border-border/60',
        elevated && 'bg-card-elevated shadow-card',
        hover && 'transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────
   SKELETON
───────────────────────────────────────── */
export function Skeleton({ className }) {
  return <div className={cn('shimmer rounded-xl bg-muted/80', className)} />
}

/* ─────────────────────────────────────────
   SPINNER
───────────────────────────────────────── */
export function Spinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'h-4 w-4 border-[1.5px]',
    md: 'h-5 w-5 border-2',
    lg: 'h-8 w-8 border-2',
  }
  return (
    <div className={cn(
      'animate-spin rounded-full border-muted-foreground/20 border-t-primary',
      sizes[size], className
    )} />
  )
}

/* ─────────────────────────────────────────
   SELECT
───────────────────────────────────────── */
export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-xl border border-input bg-background/80 px-4 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-transparent',
        'transition-all duration-200 appearance-none cursor-pointer',
        'text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

/* ─────────────────────────────────────────
   DIVIDER
───────────────────────────────────────── */
export function Divider({ className }) {
  return <div className={cn('h-px bg-border/60', className)} />
}

/* ─────────────────────────────────────────
   AVATAR
───────────────────────────────────────── */
export function Avatar({ src, name, size = 'md', className }) {
  const sizes = {
    xs:  'h-6 w-6 text-[10px]',
    sm:  'h-7 w-7 text-xs',
    md:  'h-9 w-9 text-sm',
    lg:  'h-11 w-11 text-base',
    xl:  'h-14 w-14 text-lg',
    '2xl': 'h-20 w-20 text-2xl',
  }
  return (
    <div className={cn(
      'rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-border/40',
      sizes[size], className
    )}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <span className="font-semibold text-primary">{name?.[0]?.toUpperCase() || '?'}</span>
      }
    </div>
  )
}

/* ─────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────── */
export function SectionHeader({ title, action, className }) {
  return (
    <div className={cn('flex items-center justify-between mb-5', className)}>
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────
   PAGE CONTAINER
   Single source of truth for max-width + horizontal padding.
   Use on every page root div.
───────────────────────────────────────── */
export function PageContainer({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'w-full max-w-screen-xl mx-auto',
        'px-4 sm:px-6 lg:px-10 xl:px-12',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────
   SECTION WRAPPER
   Consistent vertical rhythm between every section.
───────────────────────────────────────── */
export function SectionWrapper({ className, children, ...props }) {
  return (
    <section className={cn('mt-10 md:mt-14', className)} {...props}>
      {children}
    </section>
  )
}

/* ─────────────────────────────────────────
   SECTION TITLE ROW
   [Title left] [Action right] with consistent bottom margin.
───────────────────────────────────────── */
export function SectionTitle({ title, action, className }) {
  return (
    <div className={cn('flex items-center justify-between mb-4 md:mb-5', className)}>
      <h2 className="text-lg md:text-xl font-semibold tracking-tight text-foreground leading-tight">
        {title}
      </h2>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────
   MEDIA GRID
   Canonical responsive poster grid used on all list/search pages.
───────────────────────────────────────── */
export function MediaGrid({ className, children }) {
  return (
    <div
      className={cn(
        'grid gap-3 md:gap-4',
        'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
        className
      )}
    >
      {children}
    </div>
  )
}
