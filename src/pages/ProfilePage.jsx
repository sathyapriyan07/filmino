import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { watchlistService, ratingService, reviewService } from '../services/social'
import { supabase } from '../services/supabase'
import { getRecentlyViewed } from '../hooks/useRecentlyViewed'
import MediaCard from '../components/MediaCard'
import StarRating from '../components/StarRating'
import { Skeleton, Button, Input, Avatar, PageContainer, MediaGrid } from '../components/ui'
import { Star, Bookmark, MessageSquare, Clock, Activity, Edit2, Check, X } from 'lucide-react'
import { cn } from '../utils/helpers'

const TABS = [
  { id: 'watchlist',  label: 'Watchlist',  icon: Bookmark },
  { id: 'ratings',    label: 'Ratings',    icon: Star },
  { id: 'reviews',    label: 'Reviews',    icon: MessageSquare },
  { id: 'activity',   label: 'Activity',   icon: Activity },
  { id: 'recent',     label: 'Recently Viewed', icon: Clock },
]

function ActivityItem({ type, media, data }) {
  const title = media?._type === 'movie' ? media?.title : media?.name
  const href  = media ? `/${media._type}/${media.id}` : '#'

  const icons = { watchlist: Bookmark, rating: Star, review: MessageSquare }
  const Icon  = icons[type] || Activity
  const colors = { watchlist: 'text-primary bg-primary/10', rating: 'text-amber-400 bg-amber-400/10', review: 'text-emerald-400 bg-emerald-400/10' }

  const descriptions = {
    watchlist: 'Added to watchlist',
    rating:    `Rated ${data?.rating}/10`,
    review:    'Wrote a review',
  }

  return (
    <div className="flex items-start gap-4 py-4 border-b border-border/50 last:border-0">
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0', colors[type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{descriptions[type]}</span>
          {title && (
            <Link to={href} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1">
              {title}
            </Link>
          )}
        </div>
        {type === 'review' && data?.review_text && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{data.review_text}</p>
        )}
        <div className="text-xs text-muted-foreground/60 mt-1">
          {new Date(data?.created_at || data?.added_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
      {media?.poster && (
        <Link to={href} className="flex-shrink-0">
          <img src={media.poster} alt={title} className="w-9 h-12 object-cover rounded-lg" />
        </Link>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user, profile, updateProfile, isAuthenticated } = useAuthStore()
  const [tab, setTab]           = useState('watchlist')
  const [watchlist, setWatchlist] = useState([])
  const [ratings, setRatings]   = useState([])
  const [reviews, setReviews]   = useState([])
  const [mediaMap, setMediaMap] = useState({})
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [loading, setLoading]   = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [username, setUsername] = useState('')
  const [saving, setSaving]     = useState(false)

  if (!isAuthenticated()) return <Navigate to="/login" replace />

  useEffect(() => {
    setUsername(profile?.username || '')
    setRecentlyViewed(getRecentlyViewed())
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

      const allItems = [...(wl || []), ...(rt || []), ...(rv.data || []).filter(r => r.user_id === user.id)]
      const movieIds  = [...new Set(allItems.filter(i => i.media_type === 'movie').map(i => i.media_id))]
      const seriesIds = [...new Set(allItems.filter(i => i.media_type === 'series').map(i => i.media_id))]

      const [movies, series] = await Promise.all([
        movieIds.length  > 0 ? supabase.from('movies').select('id,title,poster,vote_average,release_date,genres').in('id', movieIds)  : { data: [] },
        seriesIds.length > 0 ? supabase.from('series').select('id,name,poster,vote_average,first_air_date,genres').in('id', seriesIds) : { data: [] },
      ])

      const map = {}
      ;(movies.data || []).forEach(m => { map[`movie-${m.id}`]  = { ...m, _type: 'movie'  } })
      ;(series.data || []).forEach(s => { map[`series-${s.id}`] = { ...s, _type: 'series' } })
      setMediaMap(map)
    } finally { setLoading(false) }
  }

  const saveProfile = async () => {
    setSaving(true)
    try { await updateProfile({ username }); setEditMode(false) }
    finally { setSaving(false) }
  }

  // Build activity feed sorted by date
  const activityFeed = [
    ...watchlist.map(i => ({ type: 'watchlist', data: i, mediaKey: `${i.media_type}-${i.media_id}`, date: i.added_at })),
    ...ratings.map(i   => ({ type: 'rating',    data: i, mediaKey: `${i.media_type}-${i.media_id}`, date: i.created_at })),
    ...reviews.map(i   => ({ type: 'review',    data: i, mediaKey: `${i.media_type}-${i.media_id}`, date: i.created_at })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30)

  const tabCounts = {
    watchlist: watchlist.length,
    ratings:   ratings.length,
    reviews:   reviews.length,
    activity:  activityFeed.length,
    recent:    recentlyViewed.length,
  }

  return (
    <PageContainer className="py-8 md:py-10 page-enter">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-5">
          <Avatar src={profile?.avatar_url} name={profile?.username} size="2xl" />
          <div className="flex-1 min-w-0">
            {editMode ? (
              <div className="flex items-center gap-2 mb-2">
                <Input value={username} onChange={e => setUsername(e.target.value)} className="max-w-xs h-9" />
                <button onClick={saveProfile} disabled={saving}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditMode(false)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-secondary hover:bg-accent transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black">{profile?.username}</h1>
                <button onClick={() => setEditMode(true)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="text-muted-foreground text-sm mb-4">{profile?.email}</p>
            <div className="flex gap-6 text-sm">
              {[
                { label: 'Watchlist', value: watchlist.length },
                { label: 'Ratings',   value: ratings.length },
                { label: 'Reviews',   value: reviews.length },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="font-black text-lg">{value}</span>
                  <span className="text-muted-foreground ml-1.5">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/60 mb-6 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200',
              tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>
            <Icon className="h-3.5 w-3.5" />
            {label}
            {tabCounts[id] > 0 && (
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full', tab === id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                {tabCounts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <MediaGrid className="grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />)}
        </MediaGrid>
      ) : (
        <div className="animate-fade-in">
          {/* Watchlist */}
          {tab === 'watchlist' && (
            watchlist.length === 0
              ? <EmptyState icon={Bookmark} message="Your watchlist is empty" />
              : <MediaGrid className="grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
                  {watchlist.map(item => {
                    const media = mediaMap[`${item.media_type}-${item.media_id}`]
                    if (!media) return null
                    return <MediaCard key={item.id} item={media} type={media._type} />
                  })}
                </MediaGrid>
          )}

          {/* Ratings */}
          {tab === 'ratings' && (
            ratings.length === 0
              ? <EmptyState icon={Star} message="No ratings yet" />
              : <div className="space-y-2">
                  {ratings.map(item => {
                    const media = mediaMap[`${item.media_type}-${item.media_id}`]
                    if (!media) return null
                    const title = media._type === 'movie' ? media.title : media.name
                    return (
                      <Link key={item.id} to={`/${media._type}/${media.id}`}
                        className="flex items-center gap-4 bg-card border border-border rounded-xl p-3 hover:bg-accent/50 transition-colors">
                        {media.poster && <img src={media.poster} alt={title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm line-clamp-1">{title}</div>
                          <div className="text-xs text-muted-foreground capitalize">{media._type}</div>
                        </div>
                        <StarRating value={item.rating} max={10} readonly size="sm" />
                      </Link>
                    )
                  })}
                </div>
          )}

          {/* Reviews */}
          {tab === 'reviews' && (
            reviews.length === 0
              ? <EmptyState icon={MessageSquare} message="No reviews yet" />
              : <div className="space-y-4">
                  {reviews.map(review => {
                    const media = mediaMap[`${review.media_type}-${review.media_id}`]
                    const title = media?._type === 'movie' ? media?.title : media?.name
                    return (
                      <div key={review.id} className="bg-card border border-border rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                          {media?.poster && <img src={media.poster} alt={title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <Link to={`/${review.media_type}/${review.media_id}`} className="font-semibold hover:text-primary transition-colors line-clamp-1">{title}</Link>
                            <div className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</div>
                          </div>
                          {review.rating && (
                            <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="text-sm font-bold">{review.rating}/10</span>
                            </div>
                          )}
                        </div>
                        {review.review_text && <p className="text-sm text-muted-foreground leading-relaxed">{review.review_text}</p>}
                      </div>
                    )
                  })}
                </div>
          )}

          {/* Activity Feed */}
          {tab === 'activity' && (
            activityFeed.length === 0
              ? <EmptyState icon={Activity} message="No activity yet" />
              : <div className="bg-card border border-border rounded-2xl px-5 divide-y divide-border/0 max-w-2xl">
                  {activityFeed.map((item, i) => (
                    <ActivityItem key={i} type={item.type} media={mediaMap[item.mediaKey]} data={item.data} />
                  ))}
                </div>
          )}

          {/* Recently Viewed */}
          {tab === 'recent' && (
            recentlyViewed.length === 0
              ? <EmptyState icon={Clock} message="Nothing viewed yet" />
              : <MediaGrid className="grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
                  {recentlyViewed.map((item, i) => (
                    <MediaCard key={`${item._type}-${item.id}-${i}`} item={item} type={item._type} />
                  ))}
                </MediaGrid>
          )}
        </div>
      )}
    </PageContainer>
  )
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="text-center py-20 text-muted-foreground">
      <Icon className="h-12 w-12 mx-auto mb-3 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
