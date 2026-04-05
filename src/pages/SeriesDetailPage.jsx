import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Star, Calendar, Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { seriesService } from '../services/media'
import { personService } from '../services/persons'
import { reviewService, watchlistService, ratingService } from '../services/social'
import { mediaVideoService } from '../services/admin'
import { useAuthStore } from '../store/authStore'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import StarRating from '../components/StarRating'
import CastCarousel from '../components/CastCarousel'
import TrailerModal from '../components/TrailerModal'
import { Skeleton, Textarea } from '../components/ui'
import { formatDate, getGenreNames, cn } from '../utils/helpers'

const TABS = ['Overview', 'Seasons', 'Cast', 'Reviews']

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

export default function SeriesDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const { add: addRecent } = useRecentlyViewed()
  const [series,          setSeries]          = useState(null)
  const [seasons,         setSeasons]         = useState([])
  const [episodes,        setEpisodes]        = useState({})
  const [credits,         setCredits]         = useState([])
  const [videos,          setVideos]          = useState([])
  const [reviews,         setReviews]         = useState([])
  const [loading,         setLoading]         = useState(true)
  const [inWatchlist,     setInWatchlist]     = useState(false)
  const [userRating,      setUserRating]      = useState(0)
  const [reviewText,      setReviewText]      = useState('')
  const [submitting,      setSubmitting]      = useState(false)
  const [activeVideo,     setActiveVideo]     = useState(null)
  const [expandedSeason,  setExpandedSeason]  = useState(null)
  const [activeTab,       setActiveTab]       = useState('Overview')

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
      setSeries(seriesData); setSeasons(seasonsData || [])
      setCredits(creditsData || []); setVideos(videosData || []); setReviews(reviewsData || [])

      if (seriesData) addRecent({ id: seriesData.id, name: seriesData.name, poster: seriesData.poster, vote_average: seriesData.vote_average, first_air_date: seriesData.first_air_date, _type: 'series' })

      if (user) {
        const [wl, rating, userReview] = await Promise.all([
          watchlistService.check(user.id, id, 'series'),
          ratingService.getUserRating(user.id, id, 'series'),
          reviewService.getUserReview(user.id, id, 'series'),
        ])
        setInWatchlist(wl); setUserRating(rating || 0)
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
      setReviews(await reviewService.getForMedia(id, 'series'))
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="bg-[#0B0B0F] min-h-screen">
      <Skeleton className="h-[70vh] w-full rounded-none bg-white/5" />
      <div className="ott-container py-10 space-y-4">
        <Skeleton className="h-8 w-64 bg-white/5 rounded-xl" />
        <Skeleton className="h-4 w-full max-w-lg bg-white/5 rounded-lg" />
      </div>
    </div>
  )

  if (!series) return (
    <div className="bg-[#0B0B0F] min-h-screen flex items-center justify-center">
      <p className="text-white/40">Series not found</p>
    </div>
  )

  const cast    = credits.filter(c => c.role === 'cast')
  const crew    = credits.filter(c => c.role === 'crew')
  const genres  = getGenreNames(series.genres)
  const trailer = videos.find(v => v.video_type === 'Trailer') || videos[0]

  return (
    <div className="bg-[#0B0B0F] min-h-screen page-enter">

      {/* ── Cinematic Hero ── */}
      <div className="relative h-[72vh] min-h-[520px] overflow-hidden">
        <img src={series.backdrop || series.poster} alt={series.name} className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 detail-hero-gradient" />

        <div className="absolute inset-0 flex items-end">
          <div className="ott-container w-full pb-10 md:pb-14">
            <div className="flex items-end gap-8">
              {series.poster && (
                <div className="hidden lg:block flex-shrink-0 -mb-20 relative z-10">
                  <img src={series.poster} alt={series.name}
                    className="w-44 xl:w-52 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] border border-white/10" />
                </div>
              )}
              <div className="flex-1 min-w-0 stagger">
                <div className="flex flex-wrap gap-2 mb-4">
                  {genres.map(g => (
                    <span key={g} className="text-[11px] font-semibold text-white/70 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1">{g}</span>
                  ))}
                </div>
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-white leading-[1.02] tracking-tight mb-3 text-cinematic">
                  {series.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/55">
                  {series.vote_average > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-white">{series.vote_average.toFixed(1)}</span>
                      <span className="text-white/30 font-normal text-xs">/ 10</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(series.first_air_date)}
                  </span>
                  {series.status && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/8 border border-white/10 text-xs font-medium text-white/60">{series.status}</span>
                  )}
                  <span className="text-white/55">{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</span>
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
            <button onClick={() => setActiveVideo(trailer.key)}
              className="flex items-center gap-2.5 h-11 px-7 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 active:scale-95 transition-all">
              <Play className="h-4 w-4 fill-black" />
              Watch Trailer
            </button>
          )}
          {user && (
            <button onClick={toggleWatchlist}
              className={cn(
                'flex items-center gap-2.5 h-11 px-6 rounded-full text-sm font-semibold border transition-all active:scale-95',
                inWatchlist
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                  : 'bg-white/8 border-white/15 text-white hover:bg-white/12'
              )}>
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

        {/* Tabs */}
        <div className="flex gap-6 border-b border-white/8 mb-10 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('ott-tab', activeTab === tab ? 'ott-tab-active' : 'ott-tab-inactive')}>
              {tab}
              {tab === 'Seasons' && seasons.length > 0 && <span className="ml-1.5 text-[11px] opacity-40">({seasons.length})</span>}
              {tab === 'Cast'    && cast.length    > 0 && <span className="ml-1.5 text-[11px] opacity-40">({cast.length})</span>}
              {tab === 'Reviews' && reviews.length > 0 && <span className="ml-1.5 text-[11px] opacity-40">({reviews.length})</span>}
            </button>
          ))}
        </div>

        <div className="animate-fade-in">

          {/* Overview */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 xl:gap-16">
              <div className="space-y-10">
                <section>
                  <h2 className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-4">Synopsis</h2>
                  <p className="text-white/65 leading-relaxed text-[15px] md:text-base">{series.overview}</p>
                </section>
                {videos.length > 0 && (
                  <section>
                    <h2 className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-4">Videos</h2>
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
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
              <div className="space-y-6">
                <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 grid grid-cols-2 gap-5">
                  {[
                    { label: 'Status',      value: series.status },
                    { label: 'Language',    value: series.language?.toUpperCase() },
                    { label: 'First Aired', value: formatDate(series.first_air_date) },
                    { label: 'Seasons',     value: String(seasons.length) },
                  ].map(({ label, value }) => value && (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-medium text-white/35 uppercase tracking-wider">{label}</span>
                      <span className="text-sm font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>
                {crew.length > 0 && (
                  <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5">
                    <h3 className="text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-4">Key Crew</h3>
                    <div className="space-y-3">
                      {crew.slice(0, 6).map(c => (
                        <div key={c.id} className="flex items-center justify-between">
                          <Link to={`/person/${c.person_id}`} className="text-sm font-medium text-white/80 hover:text-white transition-colors">{c.persons?.name}</Link>
                          <span className="text-xs text-white/30">{c.job}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seasons */}
          {activeTab === 'Seasons' && (
            <div className="space-y-3 max-w-3xl">
              {seasons.map(season => (
                <div key={season.id} className="bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden">
                  <button onClick={() => toggleSeason(season)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.04] transition-colors text-left">
                    {season.poster && (
                      <img src={season.poster} alt={season.name} className="w-12 h-16 object-cover rounded-xl flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-white">{season.name || `Season ${season.season_number}`}</div>
                      {season.air_date && <div className="text-xs text-white/35 mt-0.5">{formatDate(season.air_date)}</div>}
                    </div>
                    {expandedSeason === season.id
                      ? <ChevronUp className="h-4 w-4 text-white/30" />
                      : <ChevronDown className="h-4 w-4 text-white/30" />
                    }
                  </button>
                  {expandedSeason === season.id && (
                    <div className="border-t border-white/8 divide-y divide-white/[0.05]">
                      {(episodes[season.id] || []).map(ep => (
                        <div key={ep.id} className="flex items-start gap-4 p-4">
                          {ep.still && <img src={ep.still} alt={ep.name} loading="lazy" className="w-24 aspect-video object-cover rounded-lg flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full font-semibold">E{ep.episode_number}</span>
                              <span className="font-medium text-sm text-white">{ep.name}</span>
                              {ep.rating > 0 && (
                                <span className="ml-auto flex items-center gap-1 text-amber-400 text-xs flex-shrink-0">
                                  <Star className="h-3 w-3 fill-current" />{ep.rating}
                                </span>
                              )}
                            </div>
                            {ep.overview && <p className="text-xs text-white/40 line-clamp-2">{ep.overview}</p>}
                            <div className="flex gap-3 mt-1 text-xs text-white/30">
                              {ep.air_date && <span>{formatDate(ep.air_date)}</span>}
                              {ep.runtime && <span>{ep.runtime}m</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                      {!episodes[season.id] && <div className="p-4 text-sm text-white/35">Loading…</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Cast */}
          {activeTab === 'Cast' && (
            cast.length > 0
              ? <CastCarousel cast={cast} />
              : <p className="text-white/35 text-sm py-8">No cast information available.</p>
          )}

          {/* Reviews */}
          {activeTab === 'Reviews' && (
            <div className="max-w-3xl space-y-4">
              {user && (
                <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 mb-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Write a Review</h3>
                  <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your thoughts…"
                    className="mb-4 bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none" rows={3} />
                  <div className="flex items-center justify-between">
                    <StarRating value={userRating} onChange={handleRating} max={10} size="sm" />
                    <button onClick={submitReview} disabled={submitting || !reviewText.trim()}
                      className="h-9 px-5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      {submitting ? 'Posting…' : 'Post Review'}
                    </button>
                  </div>
                </div>
              )}
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              {reviews.length === 0 && <p className="text-white/35 text-sm py-8">No reviews yet.</p>}
            </div>
          )}
        </div>
      </div>

      {activeVideo && <TrailerModal videoKey={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  )
}
