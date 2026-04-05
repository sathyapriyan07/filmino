import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Star, Clock, Calendar, Bookmark, BookmarkCheck, ChevronRight } from 'lucide-react'
import { movieService } from '../services/media'
import { personService } from '../services/persons'
import { reviewService, watchlistService, ratingService } from '../services/social'
import { mediaImageService, mediaVideoService } from '../services/admin'
import { useAuthStore } from '../store/authStore'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import MovieRow from '../components/MovieRow'
import StarRating from '../components/StarRating'
import CastCarousel from '../components/CastCarousel'
import TrailerModal from '../components/TrailerModal'
import { Skeleton, Textarea } from '../components/ui'
import { formatDate, formatRuntime, formatMoney, getGenreNames, cn } from '../utils/helpers'

const TABS = ['Overview', 'Cast', 'Reviews', 'Similar']

/* ── Review card ── */
function ReviewCard({ review }) {
  return (
    <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-indigo-400">{review.users?.username?.[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">{review.users?.username}</div>
          <div className="text-xs text-white/35">{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
        {review.rating && (
          <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-sm font-bold text-white">{review.rating}<span className="text-white/30 font-normal">/10</span></span>
          </div>
        )}
      </div>
      {review.review_text && <p className="text-sm text-white/55 leading-relaxed">{review.review_text}</p>}
    </div>
  )
}

/* ── Detail stat pill ── */
function StatPill({ label, value }) {
  if (!value || value === 'N/A') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-white/35 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

export default function MovieDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const { add: addRecent } = useRecentlyViewed()
  const [movie,       setMovie]       = useState(null)
  const [credits,     setCredits]     = useState([])
  const [images,      setImages]      = useState([])
  const [videos,      setVideos]      = useState([])
  const [reviews,     setReviews]     = useState([])
  const [similar,     setSimilar]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [userRating,  setUserRating]  = useState(0)
  const [reviewText,  setReviewText]  = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [activeVideo, setActiveVideo] = useState(null)
  const [activeTab,   setActiveTab]   = useState('Overview')

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
      setMovie(movieData); setCredits(creditsData || []); setImages(imagesData || [])
      setVideos(videosData || []); setReviews(reviewsData || [])

      const genres = getGenreNames(movieData?.genres)
      const similarData = await movieService.getSimilar(id, genres, 12)
      setSimilar(similarData || [])

      if (movieData) addRecent({ id: movieData.id, title: movieData.title, poster: movieData.poster, vote_average: movieData.vote_average, release_date: movieData.release_date, _type: 'movie' })

      if (user) {
        const [wl, rating, userReview] = await Promise.all([
          watchlistService.check(user.id, id, 'movie'),
          ratingService.getUserRating(user.id, id, 'movie'),
          reviewService.getUserReview(user.id, id, 'movie'),
        ])
        setInWatchlist(wl); setUserRating(rating || 0)
        if (userReview) setReviewText(userReview.review_text || '')
      }
    } finally { setLoading(false) }
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
      setReviews(await reviewService.getForMedia(id, 'movie'))
    } finally { setSubmitting(false) }
  }

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="bg-[#0B0B0F] min-h-screen">
      <Skeleton className="h-[70vh] w-full rounded-none bg-white/5" />
      <div className="ott-container py-10 space-y-4">
        <Skeleton className="h-8 w-64 bg-white/5 rounded-xl" />
        <Skeleton className="h-4 w-full max-w-lg bg-white/5 rounded-lg" />
        <Skeleton className="h-4 w-3/4 max-w-md bg-white/5 rounded-lg" />
      </div>
    </div>
  )

  if (!movie) return (
    <div className="bg-[#0B0B0F] min-h-screen flex items-center justify-center">
      <p className="text-white/40">Movie not found</p>
    </div>
  )

  const cast      = credits.filter(c => c.role === 'cast')
  const crew      = credits.filter(c => c.role === 'crew')
  const director  = crew.find(c => c.job === 'Director')
  const genres    = getGenreNames(movie.genres)
  const trailer   = videos.find(v => v.video_type === 'Trailer') || videos[0]
  const backdrops = images.filter(i => i.image_type === 'backdrop')

  return (
    <div className="bg-[#0B0B0F] min-h-screen page-enter">

      {/* ── Cinematic Hero ── */}
      <div className="relative h-[72vh] min-h-[520px] overflow-hidden">
        <img
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover object-top"
        />
        {/* Layered gradients */}
        <div className="absolute inset-0 detail-hero-gradient" />

        {/* Content anchored to bottom */}
        <div className="absolute inset-0 flex items-end">
          <div className="ott-container w-full pb-10 md:pb-14">
            <div className="flex items-end gap-8">

              {/* Poster — desktop only */}
              {movie.poster && (
                <div className="hidden lg:block flex-shrink-0 -mb-20 relative z-10">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-44 xl:w-52 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] border border-white/10"
                  />
                </div>
              )}

              {/* Text */}
              <div className="flex-1 min-w-0 stagger">
                {/* Genre chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {genres.map(g => (
                    <span key={g} className="text-[11px] font-semibold text-white/70 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1">
                      {g}
                    </span>
                  ))}
                </div>

                <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-white leading-[1.02] tracking-tight mb-3 text-cinematic">
                  {movie.title}
                </h1>

                {movie.tagline && (
                  <p className="text-white/45 italic text-sm md:text-base mb-4">{movie.tagline}</p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/55">
                  {movie.vote_average > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-white">{movie.vote_average.toFixed(1)}</span>
                      <span className="text-white/30 font-normal text-xs">/ 10</span>
                      {movie.vote_count > 0 && <span className="text-white/25 font-normal text-xs">({movie.vote_count.toLocaleString()})</span>}
                    </span>
                  )}
                  {movie.runtime > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRuntime(movie.runtime)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(movie.release_date)}
                  </span>
                  {movie.status && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/8 border border-white/10 text-xs font-medium text-white/60">
                      {movie.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="ott-container pt-6 lg:pt-24 pb-20">

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          {trailer && (
            <button
              onClick={() => setActiveVideo(trailer.key)}
              className="flex items-center gap-2.5 h-11 px-7 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 active:scale-95 transition-all"
            >
              <Play className="h-4 w-4 fill-black" />
              Watch Trailer
            </button>
          )}
          {user && (
            <button
              onClick={toggleWatchlist}
              className={cn(
                'flex items-center gap-2.5 h-11 px-6 rounded-full text-sm font-semibold border transition-all active:scale-95',
                inWatchlist
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                  : 'bg-white/8 border-white/15 text-white hover:bg-white/12'
              )}
            >
              {inWatchlist ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
          )}
          {user && (
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs text-white/35 font-medium">Your rating</span>
              <StarRating value={userRating} onChange={handleRating} max={10} />
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-6 border-b border-white/8 mb-10 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn('ott-tab', activeTab === tab ? 'ott-tab-active' : 'ott-tab-inactive')}
            >
              {tab}
              {tab === 'Cast'    && cast.length    > 0 && <span className="ml-1.5 text-[11px] opacity-40">({cast.length})</span>}
              {tab === 'Reviews' && reviews.length > 0 && <span className="ml-1.5 text-[11px] opacity-40">({reviews.length})</span>}
              {tab === 'Similar' && similar.length > 0 && <span className="ml-1.5 text-[11px] opacity-40">({similar.length})</span>}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="animate-fade-in">

          {/* Overview */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 xl:gap-16">
              <div className="space-y-10">
                {/* Synopsis */}
                <section>
                  <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">Synopsis</h2>
                  <p className="text-white/65 leading-relaxed text-[15px] md:text-base">{movie.overview}</p>
                </section>

                {/* Gallery */}
                {backdrops.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {backdrops.slice(0, 6).map((img, i) => (
                        <img key={i} src={img.file_path} alt="" loading="lazy"
                          className="rounded-xl aspect-video object-cover hover:opacity-80 transition-opacity cursor-pointer" />
                      ))}
                    </div>
                  </section>
                )}

                {/* Videos */}
                {videos.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">Videos</h2>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                      {videos.map(v => (
                        <button key={v.id} onClick={() => setActiveVideo(v.key)}
                          className="flex-shrink-0 relative w-52 aspect-video rounded-xl overflow-hidden group">
                          <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                            <div className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                              <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80">
                            <p className="text-white text-xs font-medium line-clamp-1">{v.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Stats grid */}
                <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 grid grid-cols-2 gap-5">
                  <StatPill label="Director" value={director?.persons?.name} />
                  <StatPill label="Status"   value={movie.status} />
                  <StatPill label="Language" value={movie.language?.toUpperCase()} />
                  <StatPill label="Runtime"  value={formatRuntime(movie.runtime)} />
                  <StatPill label="Budget"   value={formatMoney(movie.budget)} />
                  <StatPill label="Revenue"  value={formatMoney(movie.revenue)} />
                </div>

                {/* Director link */}
                {director && (
                  <Link to={`/person/${director.person_id}`}
                    className="flex items-center justify-between bg-white/[0.04] border border-white/8 rounded-2xl p-4 hover:bg-white/[0.07] transition-colors group">
                    <div>
                      <p className="text-[11px] text-white/35 uppercase tracking-wider mb-0.5">Director</p>
                      <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">{director.persons?.name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/25 group-hover:text-white/50 transition-colors" />
                  </Link>
                )}

                {/* Crew */}
                {crew.length > 0 && (
                  <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5">
                    <h3 className="text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-4">Key Crew</h3>
                    <div className="space-y-3">
                      {crew.slice(0, 6).map(c => (
                        <div key={c.id} className="flex items-center justify-between">
                          <Link to={`/person/${c.person_id}`} className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                            {c.persons?.name}
                          </Link>
                          <span className="text-xs text-white/30">{c.job}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cast */}
          {activeTab === 'Cast' && (
            cast.length > 0
              ? <CastCarousel cast={cast} />
              : <EmptyTabState message="No cast information available." />
          )}

          {/* Reviews */}
          {activeTab === 'Reviews' && (
            <div className="max-w-3xl space-y-4">
              {user && (
                <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 mb-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Write a Review</h3>
                  <Textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your thoughts…"
                    className="mb-4 bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <StarRating value={userRating} onChange={handleRating} max={10} size="sm" />
                    <button
                      onClick={submitReview}
                      disabled={submitting || !reviewText.trim()}
                      className="h-9 px-5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {submitting ? 'Posting…' : 'Post Review'}
                    </button>
                  </div>
                </div>
              )}
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              {reviews.length === 0 && <EmptyTabState message="No reviews yet. Be the first!" />}
            </div>
          )}

          {/* Similar */}
          {activeTab === 'Similar' && (
            similar.length > 0
              ? <MovieRow items={similar.map(m => ({ ...m, _type: 'movie' }))} type="movie" title="" />
              : <EmptyTabState message="No similar movies found." />
          )}
        </div>

        {/* More Like This row (always shown below tabs) */}
        {similar.length > 0 && activeTab !== 'Similar' && (
          <div className="mt-16">
            <MovieRow
              title="More Like This"
              items={similar.map(m => ({ ...m, _type: 'movie' }))}
              type="movie"
            />
          </div>
        )}
      </div>

      {activeVideo && <TrailerModal videoKey={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  )
}

function EmptyTabState({ message }) {
  return <p className="text-white/35 text-sm py-8">{message}</p>
}
