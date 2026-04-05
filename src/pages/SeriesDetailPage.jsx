import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Star, Calendar, Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { seriesService } from '../services/media'
import { personService } from '../services/persons'
import { reviewService, watchlistService, ratingService } from '../services/social'
import { mediaVideoService } from '../services/admin'
import { useAuthStore } from '../store/authStore'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import MediaRow from '../components/MediaRow'
import StarRating from '../components/StarRating'
import CastCarousel from '../components/CastCarousel'
import TrailerModal from '../components/TrailerModal'
import { Skeleton, Button, Textarea, Badge, PageContainer } from '../components/ui'
import { formatDate, getGenreNames, cn } from '../utils/helpers'

const TABS = ['Overview', 'Seasons', 'Cast', 'Reviews']

export default function SeriesDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const { add: addRecent } = useRecentlyViewed()
  const [series, setSeries] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [episodes, setEpisodes] = useState({})
  const [credits, setCredits] = useState([])
  const [videos, setVideos] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeVideo, setActiveVideo] = useState(null)
  const [expandedSeason, setExpandedSeason] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const [seriesData, seasonsData, creditsData, videosData, reviewsData] = await Promise.all([
        seriesService.getById(id),
        seriesService.getSeasons(id),
        personService.getMediaCredits(id, 'series'),
        mediaVideoService.getForMedia(id, 'series'),
        reviewService.getForMedia(id, 'series'),
      ])
      setSeries(seriesData)
      setSeasons(seasonsData || [])
      setCredits(creditsData || [])
      setVideos(videosData || [])
      setReviews(reviewsData || [])

      if (seriesData) {
        addRecent({ id: seriesData.id, name: seriesData.name, poster: seriesData.poster, vote_average: seriesData.vote_average, first_air_date: seriesData.first_air_date, _type: 'series' })
      }

      if (user) {
        const [wl, rating, userReview] = await Promise.all([
          watchlistService.check(user.id, id, 'series'),
          ratingService.getUserRating(user.id, id, 'series'),
          reviewService.getUserReview(user.id, id, 'series'),
        ])
        setInWatchlist(wl)
        setUserRating(rating || 0)
        if (userReview) setReviewText(userReview.review_text || '')
      }
    } finally { setLoading(false) }
  }

  const loadEpisodes = async (seasonId) => {
    if (episodes[seasonId]) return
    const data = await seriesService.getEpisodes(seasonId)
    setEpisodes(prev => ({ ...prev, [seasonId]: data }))
  }

  const toggleSeason = async (season) => {
    if (expandedSeason === season.id) { setExpandedSeason(null) }
    else { setExpandedSeason(season.id); await loadEpisodes(season.id) }
  }

  const toggleWatchlist = async () => {
    if (!user) return
    if (inWatchlist) { await watchlistService.remove(user.id, id, 'series'); setInWatchlist(false) }
    else { await watchlistService.add(user.id, id, 'series'); setInWatchlist(true) }
  }

  const handleRating = async (rating) => {
    if (!user) return
    await ratingService.upsert(user.id, id, 'series', rating)
    setUserRating(rating)
  }

  const submitReview = async () => {
    if (!user || !reviewText.trim()) return
    setSubmitting(true)
    try {
      await reviewService.upsert({ user_id: user.id, media_id: parseInt(id), media_type: 'series', rating: userRating || null, review_text: reviewText })
      const updated = await reviewService.getForMedia(id, 'series')
      setReviews(updated)
    } finally { setSubmitting(false) }
  }

  if (loading) return <Skeleton className="h-screen w-full rounded-none" />
  if (!series) return <div className="text-center py-20 text-muted-foreground">Series not found</div>

  const cast = credits.filter(c => c.role === 'cast')
  const crew = credits.filter(c => c.role === 'crew')
  const genres = getGenreNames(series.genres)
  const trailer = videos.find(v => v.video_type === 'Trailer') || videos[0]

  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="relative h-[65vh] min-h-[500px]">
        <img src={series.backdrop || series.poster} alt={series.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <PageContainer className="pb-12 flex gap-8 items-end">
            {series.poster && (
              <img src={series.poster} alt={series.name}
                className="hidden md:block w-40 rounded-2xl shadow-2xl flex-shrink-0 -mb-16 border-2 border-border/60" />
            )}
            <div className="flex-1 stagger">
              <div className="flex flex-wrap gap-2 mb-3">
                {genres.map(g => <Badge key={g} variant="glass" className="text-xs">{g}</Badge>)}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">{series.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/75 text-sm">
                {series.vote_average > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <Star className="h-4 w-4 fill-current" />
                    <strong className="text-white">{series.vote_average?.toFixed(1)}</strong>
                    <span className="text-white/40 font-normal text-xs">/ 10</span>
                  </span>
                )}
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(series.first_air_date)}</span>
                {series.status && <span className="text-white/60">{series.status}</span>}
                <span>{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </PageContainer>
        </div>
      </div>

      <PageContainer className="pt-6 md:pt-20 pb-16">
        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {trailer && (
            <Button onClick={() => setActiveVideo(trailer.key)} className="gap-2">
              <Play className="h-4 w-4 fill-current" /> Watch Trailer
            </Button>
          )}
          {user && (
            <Button variant="outline" onClick={toggleWatchlist} className="gap-2">
              {inWatchlist ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
              {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </Button>
          )}
          {user && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Your rating:</span>
              <StarRating value={userRating} onChange={handleRating} max={10} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border/60 mb-8 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200',
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}>
              {tab}
              {tab === 'Seasons' && seasons.length > 0 && <span className="ml-1.5 text-xs opacity-60">({seasons.length})</span>}
              {tab === 'Cast' && cast.length > 0 && <span className="ml-1.5 text-xs opacity-60">({cast.length})</span>}
              {tab === 'Reviews' && reviews.length > 0 && <span className="ml-1.5 text-xs opacity-60">({reviews.length})</span>}
            </button>
          ))}
        </div>

        <div className="animate-fade-in">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <p className="text-muted-foreground leading-relaxed text-[15px]">{series.overview}</p>

                {videos.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4">Videos</h2>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                      {videos.map(v => (
                        <button key={v.id} onClick={() => setActiveVideo(v.key)}
                          className="flex-shrink-0 relative w-48 aspect-video rounded-xl overflow-hidden group">
                          <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                            <Play className="h-8 w-8 text-white fill-current" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-5">
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Details</h3>
                  {[
                    { label: 'Status', value: series.status },
                    { label: 'Language', value: series.language?.toUpperCase() },
                    { label: 'First Aired', value: formatDate(series.first_air_date) },
                    { label: 'Seasons', value: String(seasons.length) },
                  ].map(({ label, value }) => value && (
                    <div key={label}>
                      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                      <div className="text-sm">{value}</div>
                    </div>
                  ))}
                </div>
                {crew.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Crew</h3>
                    <div className="space-y-2.5">
                      {crew.slice(0, 6).map(c => (
                        <div key={c.id} className="flex items-center justify-between text-sm">
                          <Link to={`/person/${c.person_id}`} className="hover:text-primary transition-colors font-medium">{c.persons?.name}</Link>
                          <span className="text-muted-foreground text-xs">{c.job}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Seasons' && (
            <div className="space-y-3 max-w-3xl">
              {seasons.map(season => (
                <div key={season.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <button onClick={() => toggleSeason(season)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors text-left">
                    {season.poster && (
                      <img src={season.poster} alt={season.name} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{season.name || `Season ${season.season_number}`}</div>
                      {season.air_date && <div className="text-xs text-muted-foreground mt-0.5">{formatDate(season.air_date)}</div>}
                    </div>
                    {expandedSeason === season.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {expandedSeason === season.id && (
                    <div className="border-t border-border divide-y divide-border/60">
                      {(episodes[season.id] || []).map(ep => (
                        <div key={ep.id} className="flex items-start gap-4 p-4">
                          {ep.still && <img src={ep.still} alt={ep.name} loading="lazy" className="w-24 aspect-video object-cover rounded-lg flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">E{ep.episode_number}</span>
                              <span className="font-medium text-sm">{ep.name}</span>
                              {ep.rating > 0 && (
                                <span className="ml-auto flex items-center gap-1 text-amber-400 text-xs flex-shrink-0">
                                  <Star className="h-3 w-3 fill-current" />{ep.rating}
                                </span>
                              )}
                            </div>
                            {ep.overview && <p className="text-xs text-muted-foreground line-clamp-2">{ep.overview}</p>}
                            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                              {ep.air_date && <span>{formatDate(ep.air_date)}</span>}
                              {ep.runtime && <span>{ep.runtime}m</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                      {!episodes[season.id] && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Cast' && (
            cast.length > 0
              ? <CastCarousel cast={cast} />
              : <p className="text-muted-foreground">No cast information available.</p>
          )}

          {activeTab === 'Reviews' && (
            <div className="max-w-3xl space-y-4">
              {user && (
                <div className="bg-card border border-border rounded-2xl p-5 mb-6">
                  <h3 className="text-sm font-semibold mb-3">Write a Review</h3>
                  <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your thoughts…" className="mb-3" rows={3} />
                  <div className="flex items-center justify-between">
                    <StarRating value={userRating} onChange={handleRating} max={10} size="sm" />
                    <Button size="sm" onClick={submitReview} disabled={submitting || !reviewText.trim()}>
                      {submitting ? 'Posting…' : 'Post Review'}
                    </Button>
                  </div>
                </div>
              )}
              {reviews.map(r => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{r.users?.username?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{r.users?.username}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    {r.rating && (
                      <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-sm font-semibold">{r.rating}/10</span>
                      </div>
                    )}
                  </div>
                  {r.review_text && <p className="text-sm text-muted-foreground leading-relaxed">{r.review_text}</p>}
                </div>
              ))}
              {reviews.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet.</p>}
            </div>
          )}
        </div>
      </PageContainer>

      {activeVideo && <TrailerModal videoKey={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  )
}