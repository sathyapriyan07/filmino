import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function AdminLayout() {
  const { isAdmin, loading } = useAuthStore()
  if (loading) return null
  if (!isAdmin()) return <Navigate to="/" replace />
  return <Outlet />
}
