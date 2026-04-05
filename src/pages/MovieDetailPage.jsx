import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Star, Clock, Calendar, Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { movieService } from '../services/media'
import { personService } from '../services/persons'
import { reviewService, watchlistService, ratingService } from '../services/social'
import { mediaImageService, mediaVideoService } from '../services/admin'
import { useAuthStore } from '../store/authStore'
import MediaRow from '../components/MediaRow'
import StarRating from '../components/StarRating'
import { Skeleton, Button, Textarea, Badge } from '../components/ui'
import { formatDate, formatRuntime, formatMoney, getGenreNames } from '../utils/helpers'

function ReviewCard({ review }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{review.users?.username?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <div className="text-sm font-medium">{review.users?.username}</div>
          <div className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</div>
        </div>
        {review.rating && (
          <div className="ml-auto flex items-center gap-1 text-yellow-400">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{review.rating}/10</span>
          </div>
        )}
      </div>
      {review.review_text && <p className="text-sm text-muted-foreground">{review.review_text}</p>}
    </div>
  )
}

export default function MovieDetailPage() {
  const { id } = useParams()
  const { user, profile } = useAuthStore()
  const [movie, setMovie] = useState(null)
  const [credits, setCredits] = useState([])
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])
  const [reviews, setReviews] = useState([])
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeVideo, setActiveVideo] = useState(null)
  const [showAllCast, setShowAllCast] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const [movieData, creditsData, imagesData, videosData, reviewsData, similarData] = await Promise.all([
        movieService.getById(id),
        personService.getMediaCredits(id, 'movie'),
        mediaImageService.getForMedia(id, 'movie'),
        mediaVideoService.getForMedia(id, 'movie'),
        reviewService.getForMedia(id, 'movie'),
        movieService.getSimilar(id, [], 10),
      ])
      setMovie(movieData)
      setCredits(creditsData || [])
      setImages(imagesData || [])
      setVideos(videosData || [])
      setReviews(reviewsData || [])
      setSimilar(similarData || [])

      if (user) {
        const [wl, rating, userReview] = await Promise.all([
          watchlistService.check(user.id, id, 'movie'),
          ratingService.getUserRating(user.id, id, 'movie'),
          reviewService.getUserReview(user.id, id, 'movie'),
        ])
        setInWatchlist(wl)
        setUserRating(rating || 0)
        if (userReview) setReviewText(userReview.review_text || '')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleWatchlist = async () => {
    if (!user) return
    if (inWatchlist) {
      await watchlistService.remove(user.id, id, 'movie')
      setInWatchlist(false)
    } else {
      await watchlistService.add(user.id, id, 'movie')
      setInWatchlist(true)
    }
  }

  const handleRating = async (rating) => {
    if (!user) return
    await ratingService.upsert(user.id, id, 'movie', rating)
    setUserRating(rating)
  }

  const submitReview = async () => {
    if (!user || !reviewText.trim()) return
    setSubmitting(true)
    try {
      await reviewService.upsert({ user_id: user.id, media_id: parseInt(id), media_type: 'movie', rating: userRating || null, review_text: reviewText })
      const updated = await reviewService.getForMedia(id, 'movie')
      setReviews(updated)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div>
      <Skeleton className="h-[60vh] w-full rounded-none" />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )

  if (!movie) return <div className="text-center py-20 text-muted-foreground">Movie not found</div>

  const cast = credits.filter(c => c.role === 'cast')
  const crew = credits.filter(c => c.role === 'crew')
  const director = crew.find(c => c.job === 'Director')
  const genres = getGenreNames(movie.genres)
  const trailer = videos.find(v => v.video_type === 'Trailer') || videos[0]
  const backdrops = images.filter(i => i.image_type === 'backdrop')

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[65vh] min-h-[500px]">
        <img
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 pb-12 w-full flex gap-8 items-end">
            {movie.poster && (
              <img src={movie.poster} alt={movie.title}
                className="hidden md:block w-40 rounded-2xl shadow-2xl flex-shrink-0 -mb-16 border-2 border-border" />
            )}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {genres.map(g => <Badge key={g} variant="outline" className="text-white border-white/30">{g}</Badge>)}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{movie.title}</h1>
              {movie.tagline && <p className="text-white/60 italic mb-3">{movie.tagline}</p>}
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <strong className="text-white">{movie.vote_average?.toFixed(1)}</strong>/10
                  <span className="text-white/50">({movie.vote_count?.toLocaleString()})</span>
                </span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatRuntime(movie.runtime)}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(movie.release_date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:pl-4 pt-6 md:pt-20">
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

        {/* Trailer Modal */}
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setActiveVideo(null)}>
            <div className="w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
                className="w-full h-full rounded-xl"
                allowFullScreen
                allow="autoplay"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <section>
              <h2 className="text-xl font-bold mb-3">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
            </section>

            {/* Cast */}
            {cast.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Cast</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {(showAllCast ? cast : cast.slice(0, 10)).map(c => (
                    <Link key={c.id} to={`/person/${c.person_id}`} className="group text-center">
                      <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                        {c.persons?.profile_image ? (
                          <img src={c.persons.profile_image} alt={c.persons.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">
                            {c.persons?.name?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-medium line-clamp-1">{c.persons?.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{c.character}</div>
                    </Link>
                  ))}
                </div>
                {cast.length > 10 && (
                  <button onClick={() => setShowAllCast(!showAllCast)}
                    className="mt-3 text-sm text-primary flex items-center gap-1 hover:underline">
                    {showAllCast ? <><ChevronUp className="h-4 w-4" /> Show less</> : <><ChevronDown className="h-4 w-4" /> Show all {cast.length} cast</>}
                  </button>
                )}
              </section>
            )}

            {/* Gallery */}
            {backdrops.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {backdrops.slice(0, 6).map((img, i) => (
                    <img key={i} src={img.file_path} alt="" className="rounded-xl aspect-video object-cover hover:opacity-90 transition-opacity cursor-pointer" />
                  ))}
                </div>
              </section>
            )}

            {/* Videos */}
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
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80">
                        <div className="text-white text-xs line-clamp-1">{v.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <h2 className="text-xl font-bold mb-4">Reviews</h2>
              {user && (
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-medium mb-3">Write a Review</h3>
                  <Textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="mb-3"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <StarRating value={userRating} onChange={handleRating} max={10} size="sm" />
                    <Button size="sm" onClick={submitReview} disabled={submitting || !reviewText.trim()}>
                      {submitting ? 'Posting...' : 'Post Review'}
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                {reviews.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold">Details</h3>
              {director && (
                <div>
                  <div className="text-xs text-muted-foreground">Director</div>
                  <Link to={`/person/${director.person_id}`} className="text-sm hover:text-primary transition-colors">
                    {director.persons?.name}
                  </Link>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm">{movie.status || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Language</div>
                <div className="text-sm uppercase">{movie.language || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Budget</div>
                <div className="text-sm">{formatMoney(movie.budget)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Revenue</div>
                <div className="text-sm">{formatMoney(movie.revenue)}</div>
              </div>
            </div>

            {crew.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold mb-3">Crew</h3>
                <div className="space-y-2">
                  {crew.slice(0, 6).map(c => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <Link to={`/person/${c.person_id}`} className="hover:text-primary transition-colors">
                        {c.persons?.name}
                      </Link>
                      <span className="text-muted-foreground text-xs">{c.job}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-12">
            <MediaRow title="Similar Movies" items={similar} type="movie" />
          </div>
        )}
      </div>
    </div>
  )
}
