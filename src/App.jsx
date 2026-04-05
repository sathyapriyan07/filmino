import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import { LoginPage, SignupPage } from './pages/AuthPages'

const HomePage         = lazy(() => import('./pages/HomePage'))
const MoviesPage       = lazy(() => import('./pages/MoviesPage'))
const SeriesPage       = lazy(() => import('./pages/SeriesPage'))
const MovieDetailPage  = lazy(() => import('./pages/MovieDetailPage'))
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage'))
const PersonDetailPage = lazy(() => import('./pages/PersonDetailPage'))
const GenresPage       = lazy(() => import('./pages/GenresPage'))
const GenreDetailPage  = lazy(() => import('./pages/GenreDetailPage'))
const SearchPage       = lazy(() => import('./pages/SearchPage'))
const ProfilePage      = lazy(() => import('./pages/ProfilePage'))
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminMovies      = lazy(() => import('./pages/admin/AdminMovies'))
const AdminSeries      = lazy(() => import('./pages/admin/AdminSeries'))
const AdminPersons     = lazy(() => import('./pages/admin/AdminPersons'))
const AdminGenres      = lazy(() => import('./pages/admin/AdminGenres'))
const AdminSections    = lazy(() => import('./pages/admin/AdminSections'))
const AdminUsers       = lazy(() => import('./pages/admin/AdminUsers'))
const AdminReviews     = lazy(() => import('./pages/admin/AdminReviews'))
const AdminImport      = lazy(() => import('./pages/admin/AdminImport'))

const S = ({ children }) => <Suspense fallback={null}>{children}</Suspense>

export default function App() {
  const { init: initAuth }   = useAuthStore()
  const { init: initTheme }  = useThemeStore()

  useEffect(() => { initTheme(); initAuth() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<MainLayout />}>
          <Route index                    element={<S><HomePage /></S>} />
          <Route path="movies"            element={<S><MoviesPage /></S>} />
          <Route path="series"            element={<S><SeriesPage /></S>} />
          <Route path="movie/:id"         element={<S><MovieDetailPage /></S>} />
          <Route path="series/:id"        element={<S><SeriesDetailPage /></S>} />
          <Route path="person/:id"        element={<S><PersonDetailPage /></S>} />
          <Route path="genres"            element={<S><GenresPage /></S>} />
          <Route path="genre/:id"         element={<S><GenreDetailPage /></S>} />
          <Route path="search"            element={<S><SearchPage /></S>} />
          <Route path="profile"           element={<S><ProfilePage /></S>} />
          <Route path="profile/watchlist" element={<S><ProfilePage /></S>} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index              element={<S><AdminDashboard /></S>} />
          <Route path="movies"      element={<S><AdminMovies /></S>} />
          <Route path="series"      element={<S><AdminSeries /></S>} />
          <Route path="persons"     element={<S><AdminPersons /></S>} />
          <Route path="genres"      element={<S><AdminGenres /></S>} />
          <Route path="sections"    element={<S><AdminSections /></S>} />
          <Route path="users"       element={<S><AdminUsers /></S>} />
          <Route path="reviews"     element={<S><AdminReviews /></S>} />
          <Route path="import"      element={<S><AdminImport /></S>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
