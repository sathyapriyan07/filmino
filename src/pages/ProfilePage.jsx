import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { watchlistService, ratingService, reviewService } from '../services/social'
import { supabase } from '../services/supabase'
import { getRecentlyViewed } from '../hooks/useRecentlyViewed'
import MovieCard from '../components/MovieCard'
import StarRating from '../components/StarRating'
import { Skeleton, Input } from '../components/ui'
import { Star, Bookmark, MessageSquare, Clock, Activity, Edit2, Check, X } from 'lucide-react'
import { cn } from '../utils/helpers'

const TABS = [
  { id: 'watchlist', label: 'Watchlist',       icon: Bookmark },
  { id: 'ratings',   label: 'Ratings',         icon: Star },
  { id: 'reviews',   label: 'Reviews',         icon: MessageSquare },
  { id: 'activity',  label: 'Activity',        icon: Activity },
  { id: 'recent',    label: 'Recently Viewed', icon: Clock },
]

function ActivityItem({ type, media, data }) {
  const title = media?._type === 'movie' ? media?.title : media?.name
  const href  = media ? `/${media._type}/${media.id}` : '#'
  const configs = {
    watchlist: { icon: Bookmark,       color: 'text-indigo-400 bg-indigo-500/15', label: 'Added to watchlist' },
    rating:    { icon: Star,           color: 'text-amber-400 bg-amber-500/15',   label: `Rated ${data?.rating}/10` },
    review:    { icon: MessageSquare,  color: 'text-emerald-400 bg-emerald-500/15', label: 'Wrote a review' },
  }
  const { icon: Icon, color, label } = configs[type] || configs.watchlist

  return (
    <div className="flex items-start gap-4 py-4 border-b border-white/[0.06] last:border-0">
      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-white/40">{label}</span>
          {title && (
            <Link to={href} className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors line-clamp-1">
              {title}
            </Link>
          )}
        </div>
        {type === 'review' && data?.review_text && (
          <p className="text-xs text-white/30 mt-1 line-clamp-2">{data.review_text}</p>
        )}
        <p className="text-xs text-white/20 mt-1">
          {new Date(data?.created_at || data?.added_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      {media?.poster && (
        <Link to={href} className="flex-shrink-0">
          <img src={media.poster} alt={title} className="w-9 h-12 object-cover rounded-lg" />
        </Link>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-white/15" />
      </div>
      <p className="text-white/30 text-sm">{message}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { user, profile, updateProfile, isAuthenticated } = useAuthStore()
  const [tab,           setTab]           = useState('watchlist')
  const [watchlist,     setWatchlist]     = useState([])
  const [ratings,       setRatings]       = useState([])
  const [reviews,       setReviews]       = useState([])
  const [mediaMap,      setMediaMap]      = useState({})
  const [recentlyViewed,setRecentlyViewed]= useState([])
  const [loading,       setLoading]       = useState(true)
  const [editMode,      setEditMode]      = useState(false)
  const [username,      setUsername]      = useState('')
  const [saving,        setSaving]        = useState(false)

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

  const initials = profile?.username?.[0]?.toUpperCase() || '?'

  return (
    <div className="bg-[#0B0B0F] min-h-screen page-enter">
      <div className="ott-container py-10 md:py-14">

        {/* ── Profile header ── */}
        <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-start gap-5 md:gap-6">

            {/* Avatar */}
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-[0_8px_32px_rgba(99,102,241,0.4)]">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover rounded-2xl" />
                : <span className="text-2xl md:text-3xl font-black text-white">{initials}</span>
              }
            </div>

            <div className="flex-1 min-w-0">
              {/* Username row */}
              {editMode ? (
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="max-w-xs h-9 bg-white/8 border-white/15 text-white"
                  />
                  <button onClick={saveProfile} disabled={saving}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all disabled:opacity-50">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditMode(false)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/8 text-white hover:bg-white/12 transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl md:text-2xl font-black text-white">{profile?.username}</h1>
                  <button onClick={() => setEditMode(true)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <p className="text-white/35 text-sm mb-5">{profile?.email}</p>

              {/* Stats */}
              <div className="flex gap-6 md:gap-8">
                {[
                  { label: 'Watchlist', value: watchlist.length },
                  { label: 'Ratings',   value: ratings.length },
                  { label: 'Reviews',   value: reviews.length },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-xl md:text-2xl font-black text-white">{value}</span>
                    <span className="text-white/35 text-sm ml-1.5">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-6 border-b border-white/8 mb-8 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn('ott-tab flex items-center gap-2', tab === id ? 'ott-tab-active' : 'ott-tab-inactive')}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {tabCounts[id] > 0 && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                  tab === id ? 'bg-white/15 text-white' : 'bg-white/8 text-white/35'
                )}>
                  {tabCounts[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <div className="aspect-[2/3] rounded-xl bg-white/5 shimmer" />
                <div className="h-3 mt-2 w-3/4 rounded bg-white/5 shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-fade-in">

            {/* Watchlist */}
            {tab === 'watchlist' && (
              watchlist.length === 0
                ? <EmptyState icon={Bookmark} message="Your watchlist is empty" />
                : <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                    {watchlist.map(item => {
                      const media = mediaMap[`${item.media_type}-${item.media_id}`]
                      if (!media) return null
                      return <MovieCard key={item.id} item={media} type={media._type} width="w-full" />
                    })}
                  </div>
            )}

            {/* Ratings */}
            {tab === 'ratings' && (
              ratings.length === 0
                ? <EmptyState icon={Star} message="No ratings yet" />
                : <div className="space-y-2 max-w-2xl">
                    {ratings.map(item => {
                      const media = mediaMap[`${item.media_type}-${item.media_id}`]
                      if (!media) return null
                      const title = media._type === 'movie' ? media.title : media.name
                      return (
                        <Link key={item.id} to={`/${media._type}/${media.id}`}
                          className="flex items-center gap-4 bg-white/[0.04] border border-white/8 rounded-xl p-3 hover:bg-white/[0.07] transition-colors">
                          {media.poster && <img src={media.poster} alt={title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-white line-clamp-1">{title}</div>
                            <div className="text-xs text-white/30 capitalize mt-0.5">{media._type}</div>
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
                : <div className="space-y-4 max-w-2xl">
                    {reviews.map(review => {
                      const media = mediaMap[`${review.media_type}-${review.media_id}`]
                      const title = media?._type === 'movie' ? media?.title : media?.name
                      return (
                        <div key={review.id} className="bg-white/[0.04] border border-white/8 rounded-2xl p-5">
                          <div className="flex items-center gap-3 mb-3">
                            {media?.poster && <img src={media.poster} alt={title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <Link to={`/${review.media_type}/${review.media_id}`} className="font-semibold text-white hover:text-indigo-400 transition-colors line-clamp-1">{title}</Link>
                              <div className="text-xs text-white/30 mt-0.5">{new Date(review.created_at).toLocaleDateString()}</div>
                            </div>
                            {review.rating && (
                              <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-sm font-bold text-white">{review.rating}<span className="text-white/30 font-normal">/10</span></span>
                              </div>
                            )}
                          </div>
                          {review.review_text && <p className="text-sm text-white/50 leading-relaxed">{review.review_text}</p>}
                        </div>
                      )
                    })}
                  </div>
            )}

            {/* Activity */}
            {tab === 'activity' && (
              activityFeed.length === 0
                ? <EmptyState icon={Activity} message="No activity yet" />
                : <div className="bg-white/[0.04] border border-white/8 rounded-2xl px-5 max-w-2xl">
                    {activityFeed.map((item, i) => (
                      <ActivityItem key={i} type={item.type} media={mediaMap[item.mediaKey]} data={item.data} />
                    ))}
                  </div>
            )}

            {/* Recently Viewed */}
            {tab === 'recent' && (
              recentlyViewed.length === 0
                ? <EmptyState icon={Clock} message="Nothing viewed yet" />
                : <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                    {recentlyViewed.map((item, i) => (
                      <MovieCard key={`${item._type}-${item.id}-${i}`} item={item} type={item._type} width="w-full" />
                    ))}
                  </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
