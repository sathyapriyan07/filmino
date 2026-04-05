import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '../utils/helpers'

export default function StarRating({ value = 0, onChange, max = 10, size = 'md', readonly = false }) {
  const [hover, setHover] = useState(0)
  const stars = max === 10 ? 5 : max
  const scale = max / stars
  const display = hover || value
  const filled = display / scale

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: stars }).map((_, i) => {
        const starVal = (i + 1) * scale
        const isFilled = filled >= i + 1
        const isHalf = !isFilled && filled > i
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(starVal)}
            onMouseEnter={() => !readonly && setHover(starVal)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={cn('transition-transform', !readonly && 'hover:scale-110 cursor-pointer', readonly && 'cursor-default')}
          >
            <Star
              className={cn(
                size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5',
                isFilled || isHalf ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
              )}
            />
          </button>
        )
      })}
      {value > 0 && <span className="ml-1 text-sm text-muted-foreground">{value}/{max}</span>}
    </div>
  )
}
