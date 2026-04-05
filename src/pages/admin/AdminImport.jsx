import { useState, useCallback } from 'react'
import { tmdbImport } from '../../services/tmdb'
import { movieService, seriesService } from '../../services/media'
import { personService } from '../../services/persons'
import { mediaImageService, mediaVideoService, genreService } from '../../services/admin'
import { Button, Input } from '../../components/ui'
import { Download, Film, Tv, CheckCircle, XCircle, Loader, Search, Star, Calendar, X } from 'lucide-react'
import { debounce } from '../../utils/helpers'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p/w92'
const apiKey = () => import.meta.env.VITE_TMDB_API_KEY

async function tmdbSearch(query, type) {
  const endpoint = type === 'movie' ? 'search/movie' : 'search/tv'
  const res = await fetch(`${TMDB_BASE}/${endpoint}?api_key=${apiKey()}&query=${encodeURIComponent(query)}&language=en-US&page=1`)
  if (!res.ok) throw new Error('TMDb search failed')
  const data = await res.json()
  return data.results || []
}

function LogLine({ log }) {
  const icons = {
    success: <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />,
    error: <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />,
    info: <Loader className="h-4 w-4 text-blue-500 flex-shrink-0 animate-spin" />,
  }
  return (
    <div className="flex items-start gap-2 text-sm py-1.5 border-b border-border last:border-0">
      {icons[log.type] || icons.info}
      <span className={log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-green-600' : 'text-muted-foreground'}>
        {log.message}
      </span>
    </div>
  )
}

function SearchResult({ result, type, onImport, importing }) {
  const title = type === 'movie' ? result.title : result.name
  const date = type === 'movie' ? result.release_date : result.first_air_date
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent transition-colors">
      <div className="w-10 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {result.poster_path
          ? <img src={`${TMDB_IMG}${result.poster_path}`} alt={title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">N/A</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm line-clamp-1">{title}</div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          {date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{date.slice(0, 4)}
            </span>
          )}
          {result.vote_average > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />{result.vote_average.toFixed(1)}
            </span>
          )}
          <span className="text-primary/70">ID: {result.id}</span>
        </div>
        {result.overview && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{result.overview}</p>
        )}
      </div>
      <Button
        size="sm"
        onClick={() => onImport(result.id, title)}
        disabled={importing}
        className="flex-shrink-0 gap-1.5"
      >
        <Download className="h-3.5 w-3.5" />
        Import
      </Button>
    </div>
  )
}

function ImportPanel({ type }) {
  const [query, setQuery] = useState('')
  const [directId, setDirectId] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [logs, setLogs] = useState([])
  const [tab, setTab] = useState('search') // 'search' | 'id'

  const addLog = (message, logType = 'info') =>
    setLogs(prev => [...prev, { message, type: logType, id: Date.now() + Math.random() }])

  const services = { movieService, seriesService, personService, mediaImageService, mediaVideoService, genreService }

  const doSearch = useCallback(
    debounce(async (q) => {
      if (!q.trim()) { setResults([]); return }
      setSearching(true)
      try {
        const data = await tmdbSearch(q, type)
        setResults(data.slice(0, 8))
      } catch (err) {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400),
    [type]
  )

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
    doSearch(e.target.value)
  }

  const runImport = async (tmdbId, title) => {
    setImporting(true)
    setLogs([])
    try {
      addLog(`Fetching ${type === 'movie' ? 'movie' : 'series'}: "${title}" (TMDb ID: ${tmdbId})...`)
      let result
      if (type === 'movie') {
        result = await tmdbImport.importMovie(String(tmdbId), services)
        addLog(`✓ Imported: "${result.title}"`, 'success')
      } else {
        result = await tmdbImport.importSeries(String(tmdbId), services)
        addLog(`✓ Imported: "${result.name}"`, 'success')
      }
      addLog(`✓ Saved to database with ID: ${result.id}`, 'success')
      // Clear search after successful import
      setQuery('')
      setResults([])
      setDirectId('')
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error')
    } finally {
      setImporting(false)
    }
  }

  const importById = () => {
    if (!directId.trim()) return
    const title = `TMDb ID ${directId}`
    runImport(directId.trim(), title)
  }

  const isMovie = type === 'movie'
  const icon = isMovie
    ? <Film className="h-5 w-5 text-blue-500" />
    : <Tv className="h-5 w-5 text-purple-500" />

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-semibold">Import {isMovie ? 'Movie' : 'Series'}</h2>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => setTab('search')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'search' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Search className="h-3.5 w-3.5" /> Search by Title
        </button>
        <button
          onClick={() => setTab('id')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'id' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Download className="h-3.5 w-3.5" /> Import by ID
        </button>
      </div>

      {/* Search tab */}
      {tab === 'search' && (
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={handleQueryChange}
              placeholder={isMovie ? 'Search movie title...' : 'Search series title...'}
              className="pl-10 pr-10"
              disabled={importing}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {searching && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader className="h-4 w-4 animate-spin" /> Searching TMDb...
              </div>
            )}
            {!searching && query && results.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">No results found for "{query}"</div>
            )}
            {!searching && results.map(r => (
              <SearchResult
                key={r.id}
                result={r}
                type={type}
                onImport={runImport}
                importing={importing}
              />
            ))}
          </div>
        </div>
      )}

      {/* ID tab */}
      {tab === 'id' && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            From URL: themoviedb.org/{isMovie ? 'movie' : 'tv'}/<strong>ID</strong>
          </p>
          <div className="flex gap-2">
            <Input
              value={directId}
              onChange={e => setDirectId(e.target.value)}
              placeholder={isMovie ? 'e.g. 550 (Fight Club)' : 'e.g. 1396 (Breaking Bad)'}
              onKeyDown={e => e.key === 'Enter' && !importing && importById()}
              disabled={importing}
            />
            <Button onClick={importById} disabled={importing || !directId.trim()} className="gap-2 flex-shrink-0">
              <Download className="h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
      )}

      {/* Log */}
      {logs.length > 0 && (
        <div className="bg-muted/40 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Import Log</span>
            <button onClick={() => setLogs([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
          </div>
          {logs.map(log => <LogLine key={log.id} log={log} />)}
        </div>
      )}
    </div>
  )
}

export default function AdminImport() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">TMDb Import</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Search by title or enter a TMDb ID to import movies and series with full metadata, cast, images, and videos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ImportPanel type="movie" />
        <ImportPanel type="series" />
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <h3 className="font-medium text-sm mb-2">What gets imported:</h3>
        <ul className="text-xs text-muted-foreground space-y-1 grid grid-cols-2 gap-x-4">
          <li>• Title, overview, ratings, status</li>
          <li>• Cast & crew with profile images</li>
          <li>• Up to 10 backdrop images</li>
          <li>• YouTube trailers & videos</li>
          <li>• Genres (auto-created)</li>
          <li>• Series: all seasons & episodes</li>
        </ul>
      </div>
    </div>
  )
}
