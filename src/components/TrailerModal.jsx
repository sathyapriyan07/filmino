import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function TrailerModal({ videoKey, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="aspect-video rounded-2xl overflow-hidden shadow-card-xl">
          <iframe
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay"
          />
        </div>
      </div>
    </div>
  )
}
