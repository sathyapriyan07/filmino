import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Film } from 'lucide-react'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Film className="h-5 w-5" />
            <span className="text-sm">MovieDB © {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-muted-foreground">Powered by Supabase</p>
        </div>
      </footer>
    </div>
  )
}
