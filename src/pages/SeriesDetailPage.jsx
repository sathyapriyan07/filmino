import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Star, Calendar, Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { seriesService } from '../services/media'
import { personService } from '../services/persons'
import { reviewService, watchlistService, ratingService } from '../services/social'
import { mediaImageService, mediaVideoService } from '../services/admin'
import { useAuthStore } from '../store/authStore'
import MediaRow from '../components/MediaRow'
import StarRating from '../components/StarRating'
import { Skeleton, Button, Textarea, Badge } from '../components/ui'
import { formatDate, getGenreNames } from '../utils/helpers'

export default function SeriesDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
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
  const [showAllCast, setShowAllCast] = useState(false)

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
    } finally {
      setLoading(false)
    }
  }

  const loadEpisodes = async (seasonId) => {
    if (episodes[seasonId]) return
    const data = await seriesService.getEpisodes(seasonId)
    setEpisodes(prev => ({ ...prev, [seasonId]: data }))
  }

  const toggleSeason = async (season) => {
    if (expandedSeason === season.id) {
      setExpandedSeason(null)
    } else {
      setExpandedSeason(season.id)
      await loadEpisodes(season.id)
    }
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
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Skeleton className="h-screen w-full rounded-none" />
  if (!series) return <div className="text-center py-20 text-muted-foreground">Series not found</div>

  const cast = credits.filter(c => c.role === 'cast')
  const crew = credits.filter(c => c.role === 'crew')
  const genres = getGenreNames(series.genres)
  const trailer = videos.find(v => v.video_type === 'Trailer') || videos[0]

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[65vh] min-h-[500px]">
        <img src={series.backdrop || series.poster} alt={series.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 pb-12 w-full flex gap-8 items-end">
            {series.poster && (
              <img src={series.poster} alt={series.name}
                className="hidden md:block w-40 rounded-2xl shadow-2xl flex-shrink-0 -mb-16 border-2 border-border" />
            )}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {genres.map(g => <Badge key={g} variant="outline" className="text-white border-white/30">{g}</Badge>)}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{series.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <strong className="text-white">{series.vote_average?.toFixed(1)}</strong>/10
                </span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(series.first_air_date)}</span>
                <span>{series.status}</span>
                <span>{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 md:pt-20">
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Your rating:</span>
              <StarRating value={userRating} onChange={handleRating} max={10} />
            </div>
          )}
        </div>

        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setActiveVideo(null)}>
            <div className="w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
              <iframe src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`} className="w-full h-full rounded-xl" allowFullScreen allow="autoplay" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-3">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">{series.overview}</p>
            </section>

            {/* Seasons & Episodes */}
            {seasons.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Seasons & Episodes</h2>
                <div className="space-y-3">
                  {seasons.map(season => (
                    <div key={season.id} className="bg-card border border-border rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSeason(season)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-accent transition-colors text-left"
                      >
                        {season.poster && (
                          <img src={season.poster} alt={season.name} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{season.name || `Season ${season.season_number}`}</div>
                          {season.air_date && <div className="text-xs text-muted-foreground">{formatDate(season.air_date)}</div>}
                        </div>
                        {expandedSeason === season.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      {expandedSeason === season.id && (
                        <div className="border-t border-border divide-y divide-border">
                          {(episodes[season.id] || []).map(ep => (
                            <div key={ep.id} className="flex items-start gap-4 p-4">
                              {ep.still && <img src={ep.still} alt={ep.name} className="w-24 aspect-video object-cover rounded-lg flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">E{ep.episode_number}</span>
                                  <span className="font-medium text-sm">{ep.name}</span>
                                  {ep.rating > 0 && (
                                    <span className="ml-auto flex items-center gap-1 text-yellow-400 text-xs">
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
                          {!episodes[season.id] && <div className="p-4 text-sm text-muted-foreground">Loading...</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Cast</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {(showAllCast ? cast : cast.slice(0, 10)).map(c => (
                    <Link key={c.id} to={`/person/${c.person_id}`} className="group text-center">
                      <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                        {c.persons?.profile_image
                          ? <img src={c.persons.profile_image} alt={c.persons.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">{c.persons?.name?.[0]}</div>
                        }
                      </div>
                      <div className="text-xs font-medium line-clamp-1">{c.persons?.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{c.character}</div>
                    </Link>
                  ))}
                </div>
                {cast.length > 10 && (
                  <button onClick={() => setShowAllCast(!showAllCast)} className="mt-3 text-sm text-primary flex items-center gap-1 hover:underline">
                    {showAllCast ? <><ChevronUp className="h-4 w-4" /> Show less</> : <><ChevronDown className="h-4 w-4" /> Show all {cast.length} cast</>}
                  </button>
                )}
              </section>
            )}

            {/* Reviews */}
            <section>
              <h2 className="text-xl font-bold mb-4">Reviews</h2>
              {user && (
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                  <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your thoughts..." className="mb-3" rows={3} />
                  <div className="flex items-center justify-between">
                    <StarRating value={userRating} onChange={handleRating} max={10} size="sm" />
                    <Button size="sm" onClick={submitReview} disabled={submitting || !reviewText.trim()}>
                      {submitting ? 'Posting...' : 'Post Review'}
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{r.users?.username?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{r.users?.username}</div>
                        <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      {r.rating && <div className="ml-auto flex items-center gap-1 text-yellow-400"><Star className="h-4 w-4 fill-current" /><span className="text-sm">{r.rating}/10</span></div>}
                    </div>
                    {r.review_text && <p className="text-sm text-muted-foreground">{r.review_text}</p>}
                  </div>
                ))}
                {reviews.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet.</p>}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold">Details</h3>
              <div><div className="text-xs text-muted-foreground">Status</div><div className="text-sm">{series.status}</div></div>
              <div><div className="text-xs text-muted-foreground">Language</div><div className="text-sm uppercase">{series.language}</div></div>
              <div><div className="text-xs text-muted-foreground">First Aired</div><div className="text-sm">{formatDate(series.first_air_date)}</div></div>
              <div><div className="text-xs text-muted-foreground">Seasons</div><div className="text-sm">{seasons.length}</div></div>
            </div>
            {crew.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold mb-3">Crew</h3>
                <div className="space-y-2">
                  {crew.slice(0, 6).map(c => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <Link to={`/person/${c.person_id}`} className="hover:text-primary transition-colors">{c.persons?.name}</Link>
                      <span className="text-muted-foreground text-xs">{c.job}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
