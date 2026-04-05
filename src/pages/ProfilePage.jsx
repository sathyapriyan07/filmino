import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { watchlistService, ratingService, reviewService } from '../services/social'
import { supabase } from '../services/supabase'
import MediaCard from '../components/MediaCard'
import StarRating from '../components/StarRating'
import { Skeleton, Button, Input } from '../components/ui'
import { Star, Bookmark, MessageSquare, User } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, updateProfile, isAuthenticated } = useAuthStore()
  const [tab, setTab] = useState('watchlist')
  const [watchlist, setWatchlist] = useState([])
  const [ratings, setRatings] = useState([])
  const [reviews, setReviews] = useState([])
  const [mediaMap, setMediaMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isAuthenticated()) return <Navigate to="/login" replace />

  useEffect(() => {
    setUsername(profile?.username || '')
    loadData()
  }, [user?.id])

  async function loadData() {
    if (!user?.id) return
    setLoading(true)
    try {
      const [wl, rt, rv] = await Promise.all([
        watchlistService.get(user.id),
        ratingService.getUserRatings(user.id),
        reviewService.getAll({ limit: 50 }),
      ])
      setWatchlist(wl || [])
      setRatings(rt || [])
      setReviews((rv.data || []).filter(r => r.user_id === user.id))

      // Load media details
      const allItems = [...(wl || []), ...(rt || []), ...(rv.data || []).filter(r => r.user_id === user.id)]
      const movieIds = [...new Set(allItems.filter(i => i.media_type === 'movie').map(i => i.media_id))]
      const seriesIds = [...new Set(allItems.filter(i => i.media_type === 'series').map(i => i.media_id))]

      const [movies, series] = await Promise.all([
        movieIds.length > 0 ? supabase.from('movies').select('id,title,poster,vote_average,release_date,genres').in('id', movieIds) : { data: [] },
        seriesIds.length > 0 ? supabase.from('series').select('id,name,poster,vote_average,first_air_date,genres').in('id', seriesIds) : { data: [] },
      ])

      const map = {}
      ;(movies.data || []).forEach(m => { map[`movie-${m.id}`] = { ...m, _type: 'movie' } })
      ;(series.data || []).forEach(s => { map[`series-${s.id}`] = { ...s, _type: 'series' } })
      setMediaMap(map)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({ username })
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark, count: watchlist.length },
    { id: 'ratings', label: 'Ratings', icon: Star, count: ratings.length },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, count: reviews.length },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8 bg-card border border-border rounded-2xl p-6">
        <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-primary">{profile?.username?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          {editMode ? (
            <div className="flex items-center gap-3">
              <Input value={username} onChange={e => setUsername(e.target.value)} className="max-w-xs" />
              <Button size="sm" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{profile?.username}</h1>
              <button onClick={() => setEditMode(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Edit</button>
            </div>
          )}
          <p className="text-muted-foreground text-sm mt-1">{profile?.email}</p>
          <div className="flex gap-4 mt-3 text-sm">
            <span><strong>{watchlist.length}</strong> <span className="text-muted-foreground">watchlist</span></span>
            <span><strong>{ratings.length}</strong> <span className="text-muted-foreground">ratings</span></span>
            <span><strong>{reviews.length}</strong> <span className="text-muted-foreground">reviews</span></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}>
            <Icon className="h-4 w-4" />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-white/20' : 'bg-muted'}`}>{count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />)}
        </div>
      ) : (
        <>
          {tab === 'watchlist' && (
            watchlist.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Your watchlist is empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {watchlist.map(item => {
                  const media = mediaMap[`${item.media_type}-${item.media_id}`]
                  if (!media) return null
                  return <MediaCard key={item.id} item={media} type={media._type} />
                })}
              </div>
            )
          )}

          {tab === 'ratings' && (
            ratings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No ratings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ratings.map(item => {
                  const media = mediaMap[`${item.media_type}-${item.media_id}`]
                  if (!media) return null
                  const title = media._type === 'movie' ? media.title : media.name
                  return (
                    <Link key={item.id} to={`/${media._type}/${media.id}`}
                      className="flex items-center gap-4 bg-card border border-border rounded-xl p-3 hover:bg-accent transition-colors">
                      {media.poster && <img src={media.poster} alt={title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{title}</div>
                        <div className="text-xs text-muted-foreground capitalize">{media._type}</div>
                      </div>
                      <StarRating value={item.rating} max={10} readonly size="sm" />
                    </Link>
                  )
                })}
              </div>
            )
          )}

          {tab === 'reviews' && (
            reviews.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => {
                  const media = mediaMap[`${review.media_type}-${review.media_id}`]
                  const title = media?._type === 'movie' ? media?.title : media?.name
                  return (
                    <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {media?.poster && <img src={media.poster} alt={title} className="w-10 h-14 object-cover rounded-lg" />}
                        <div className="flex-1">
                          <Link to={`/${review.media_type}/${review.media_id}`} className="font-medium hover:text-primary transition-colors">{title}</Link>
                          <div className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</div>
                        </div>
                        {review.rating && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm font-medium">{review.rating}/10</span>
                          </div>
                        )}
                      </div>
                      {review.review_text && <p className="text-sm text-muted-foreground">{review.review_text}</p>}
                    </div>
                  )
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
