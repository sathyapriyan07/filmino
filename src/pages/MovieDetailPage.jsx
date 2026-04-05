import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Star, Clock, Calendar, Bookmark, BookmarkCheck } from 'lucide-react'
import { movieService } from '../services/media'
import { personService } from '../services/persons'
import { reviewService, watchlistService, ratingService } from '../services/social'
import { mediaImageService, mediaVideoService } from '../services/admin'
import { useAuthStore } from '../store/authStore'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import MediaRow from '../components/MediaRow'
import StarRating from '../components/StarRating'
import CastCarousel from '../components/CastCarousel'
import TrailerModal from '../components/TrailerModal'
import { Skeleton, Button, Textarea, Badge, PageContainer, MediaGrid } from '../components/ui'
import { formatDate, formatRuntime, formatMoney, getGenreNames, cn } from '../utils/helpers'

const TABS = ['Overview', 'Cast', 'Reviews', 'Similar']

function ReviewCard({ review }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary">{review.users?.username?.[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{review.users?.username}</div>
          <div className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</div>
        </div>
        {review.rating && (
          <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-sm font-semibold">{review.rating}/10</span>
          </div>
        )}
      </div>
      {review.review_text && <p className="text-sm text-muted-foreground leading-relaxed">{review.review_text}</p>}
    </div>
  )
}

export default function MovieDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const { add: addRecent } = useRecentlyViewed()
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
  const [activeTab, setActiveTab] = useState('Overview')

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const [movieData, creditsData, imagesData, videosData, reviewsData] = await Promise.all([
        movieService.getById(id),
        personService.getMediaCredits(id, 'movie'),
        mediaImageService.getForMedia(id, 'movie'),
        mediaVideoService.getForMedia(id, 'movie'),
        reviewService.getForMedia(id, 'movie'),
      ])
      setMovie(movieData)
      setCredits(creditsData || [])
      setImages(imagesData || [])
      setVideos(videosData || [])
      setReviews(reviewsData || [])

      // Genre-aware similar fetch after we have movie data
      const { getGenreNames } = await import('../utils/helpers')
      const genres = getGenreNames(movieData?.genres)
      const similarData = await movieService.getSimilar(id, genres, 12)
      setSimilar(similarData || [])

      if (movieData) {
        addRecent({ id: movieData.id, title: movieData.title, poster: movieData.poster, vote_average: movieData.vote_average, release_date: movieData.release_date, _type: 'movie' })
      }

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
    if (inWatchlist) { await watchlistService.remove(user.id, id, 'movie'); setInWatchlist(false) }
    else { await watchlistService.add(user.id, id, 'movie'); setInWatchlist(true) }
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
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div>
      <Skeleton className="h-[60vh] w-full rounded-none" />
      <PageContainer className="py-8 space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </PageContainer>
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
    <div className="page-enter">
      {/* Hero */}
      <div className="relative h-[65vh] min-h-[500px]">
        <img src={movie.backdrop || movie.poster} alt={movie.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <PageContainer className="pb-12 flex gap-8 items-end">
            {movie.poster && (
              <img src={movie.poster} alt={movie.title}
                className="hidden md:block w-40 rounded-2xl shadow-2xl flex-shrink-0 -mb-16 border-2 border-border/60" />
            )}
            <div className="flex-1 stagger">
              <div className="flex flex-wrap gap-2 mb-3">
                {genres.map(g => <Badge key={g} variant="glass" className="text-xs">{g}</Badge>)}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">{movie.title}</h1>
              {movie.tagline && <p className="text-white/55 italic mb-3 text-sm">{movie.tagline}</p>}
              <div className="flex flex-wrap items-center gap-4 text-white/75 text-sm">
                {movie.vote_average > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <Star className="h-4 w-4 fill-current" />
                    <strong className="text-white">{movie.vote_average?.toFixed(1)}</strong>
                    <span className="text-white/40 font-normal text-xs">/ 10 ({movie.vote_count?.toLocaleString()})</span>
                  </span>
                )}
                {movie.runtime > 0 && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatRuntime(movie.runtime)}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(movie.release_date)}</span>
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
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
              {tab === 'Cast' && cast.length > 0 && <span className="ml-1.5 text-xs opacity-60">({cast.length})</span>}
              {tab === 'Reviews' && reviews.length > 0 && <span className="ml-1.5 text-xs opacity-60">({reviews.length})</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <p className="text-muted-foreground leading-relaxed text-[15px]">{movie.overview}</p>
                </section>

                {backdrops.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4">Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {backdrops.slice(0, 6).map((img, i) => (
                        <img key={i} src={img.file_path} alt="" loading="lazy"
                          className="rounded-xl aspect-video object-cover hover:opacity-90 transition-opacity cursor-pointer" />
                      ))}
                    </div>
                  </section>
                )}

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
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Details</h3>
                  {director && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Director</div>
                      <Link to={`/person/${director.person_id}`} className="text-sm font-medium hover:text-primary transition-colors">
                        {director.persons?.name}
                      </Link>
                    </div>
                  )}
                  {[
                    { label: 'Status', value: movie.status },
                    { label: 'Language', value: movie.language?.toUpperCase() },
                    { label: 'Budget', value: formatMoney(movie.budget) },
                    { label: 'Revenue', value: formatMoney(movie.revenue) },
                  ].map(({ label, value }) => value && value !== 'N/A' && (
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
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              {reviews.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>}
            </div>
          )}

          {activeTab === 'Similar' && (
            similar.length > 0
              ? <MediaGrid>
                  {similar.map(m => (
                    <Link key={m.id} to={`/movie/${m.id}`} className="group block">
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted mb-2 group-hover:scale-[1.03] transition-transform duration-200">
                        {m.poster
                          ? <img src={m.poster} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xs text-center p-2 text-muted-foreground">{m.title}</div>
                        }
                      </div>
                      <div className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">{m.title}</div>
                    </Link>
                  ))}
                </MediaGrid>
              : <p className="text-muted-foreground">No similar movies found.</p>
          )}
        </div>

        <div className="mt-12">
          {similar.length > 0 && activeTab !== 'Similar' && (
            <MediaRow title="More Like This" items={similar.map(m => ({ ...m, _type: 'movie' }))} type="movie" />
          )}
        </div>
      </PageContainer>

      {activeVideo && <TrailerModal videoKey={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  )
}
