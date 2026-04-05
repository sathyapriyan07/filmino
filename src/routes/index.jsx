import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AdminLayout from '../layouts/AdminLayout'
import { Spinner } from '../components/ui'

const HomePage = lazy(() => import('../pages/HomePage'))
const MoviesPage = lazy(() => import('../pages/MoviesPage'))
const SeriesPage = lazy(() => import('../pages/SeriesPage'))
const MovieDetailPage = lazy(() => import('../pages/MovieDetailPage'))
const SeriesDetailPage = lazy(() => import('../pages/SeriesDetailPage'))
const PersonDetailPage = lazy(() => import('../pages/PersonDetailPage'))
const GenresPage = lazy(() => import('../pages/GenresPage'))
const GenreDetailPage = lazy(() => import('../pages/GenreDetailPage'))
const SearchPage = lazy(() => import('../pages/SearchPage'))
const ProfilePage = lazy(() => import('../pages/ProfilePage'))
const { LoginPage, SignupPage } = await import('../pages/AuthPages').then(m => m)

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const AdminMovies = lazy(() => import('../pages/admin/AdminMovies'))
const AdminSeries = lazy(() => import('../pages/admin/AdminSeries'))
const AdminPersons = lazy(() => import('../pages/admin/AdminPersons'))
const AdminGenres = lazy(() => import('../pages/admin/AdminGenres'))
const AdminSections = lazy(() => import('../pages/admin/AdminSections'))
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'))
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews'))
const AdminImport = lazy(() => import('../pages/admin/AdminImport'))

const Loading = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Spinner className="h-8 w-8" />
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Suspense fallback={<Loading />}><HomePage /></Suspense> },
      { path: 'movies', element: <Suspense fallback={<Loading />}><MoviesPage /></Suspense> },
      { path: 'series', element: <Suspense fallback={<Loading />}><SeriesPage /></Suspense> },
      { path: 'movie/:id', element: <Suspense fallback={<Loading />}><MovieDetailPage /></Suspense> },
      { path: 'series/:id', element: <Suspense fallback={<Loading />}><SeriesDetailPage /></Suspense> },
      { path: 'person/:id', element: <Suspense fallback={<Loading />}><PersonDetailPage /></Suspense> },
      { path: 'genres', element: <Suspense fallback={<Loading />}><GenresPage /></Suspense> },
      { path: 'genre/:id', element: <Suspense fallback={<Loading />}><GenreDetailPage /></Suspense> },
      { path: 'search', element: <Suspense fallback={<Loading />}><SearchPage /></Suspense> },
      { path: 'profile', element: <Suspense fallback={<Loading />}><ProfilePage /></Suspense> },
      { path: 'profile/watchlist', element: <Suspense fallback={<Loading />}><ProfilePage /></Suspense> },
    ],
  },
  {
    path: '/login',
    element: <Suspense fallback={<Loading />}><LoginPage /></Suspense>,
  },
  {
    path: '/signup',
    element: <Suspense fallback={<Loading />}><SignupPage /></Suspense>,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Suspense fallback={<Loading />}><AdminDashboard /></Suspense> },
      { path: 'movies', element: <Suspense fallback={<Loading />}><AdminMovies /></Suspense> },
      { path: 'series', element: <Suspense fallback={<Loading />}><AdminSeries /></Suspense> },
      { path: 'persons', element: <Suspense fallback={<Loading />}><AdminPersons /></Suspense> },
      { path: 'genres', element: <Suspense fallback={<Loading />}><AdminGenres /></Suspense> },
      { path: 'sections', element: <Suspense fallback={<Loading />}><AdminSections /></Suspense> },
      { path: 'users', element: <Suspense fallback={<Loading />}><AdminUsers /></Suspense> },
      { path: 'reviews', element: <Suspense fallback={<Loading />}><AdminReviews /></Suspense> },
      { path: 'import', element: <Suspense fallback={<Loading />}><AdminImport /></Suspense> },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
