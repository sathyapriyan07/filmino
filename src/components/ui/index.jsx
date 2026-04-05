import { cn } from '../../utils/helpers'

export function Button({ className, variant = 'default', size = 'default', children, ...props }) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm hover:shadow-glow',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
    'glass-dark': 'bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-black/50',
    link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
  }
  const sizes = {
    default: 'h-10 px-5 py-2 text-sm',
    sm: 'h-8 px-3 text-xs rounded-lg',
    lg: 'h-12 px-8 text-base',
    xl: 'h-14 px-10 text-base',
    icon: 'h-10 w-10',
    'icon-sm': 'h-8 w-8',
    'icon-lg': 'h-12 w-12',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className
      )}
      {...props}
    />
  )
}

export function Badge({ className, variant = 'default', children }) {
  const variants = {
    default: 'bg-primary/15 text-primary border border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground border border-border',
    destructive: 'bg-destructive/15 text-destructive border border-destructive/20',
    outline: 'border border-border text-foreground',
    success: 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20',
    warning: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
    glass: 'bg-white/15 text-white border border-white/20 backdrop-blur-sm',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card text-card-foreground',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('shimmer rounded-xl bg-muted', className)} />
}

export function Spinner({ className, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-3' }
  return (
    <div className={cn('animate-spin rounded-full border-muted border-t-primary', sizes[size], className)} />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Divider({ className }) {
  return <div className={cn('h-px bg-border', className)} />
}

export function Avatar({ src, name, size = 'md', className }) {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-xl' }
  return (
    <div className={cn('rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden', sizes[size], className)}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <span className="font-bold text-primary">{name?.[0]?.toUpperCase() || '?'}</span>
      }
    </div>
  )
}
