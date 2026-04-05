import { useState, useEffect } from 'react'
import { reviewService } from '../../services/social'
import { Skeleton, Button } from '../../components/ui'
import { Trash2, Star } from 'lucide-react'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  useEffect(() => { load() }, [page])

  async function load() {
    setLoading(true)
    const { data, count } = await reviewService.getAll({ page, limit: LIMIT })
    setReviews(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return
    await reviewService.delete(id)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reviews <span className="text-muted-foreground text-lg font-normal">({total})</span></h1>

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : reviews.map(review => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{review.users?.username}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground capitalize">{review.media_type} #{review.media_id}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                    {review.rating && (
                      <span className="flex items-center gap-1 text-yellow-400 text-xs ml-auto">
                        <Star className="h-3 w-3 fill-current" />{review.rating}/10
                      </span>
                    )}
                  </div>
                  {review.review_text && <p className="text-sm text-muted-foreground line-clamp-2">{review.review_text}</p>}
                </div>
                <button onClick={() => deleteReview(review.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {Math.ceil(total / LIMIT) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / LIMIT)}</span>
          <Button variant="outline" size="sm" disabled={page === Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
