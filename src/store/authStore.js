import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/auth'
import { supabase } from '../services/supabase'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,

      init: async () => {
        const session = await authService.getSession()
        if (session?.user) {
          try {
            const profile = await authService.getProfile(session.user.id)
            set({ user: session.user, profile, loading: false })
          } catch {
            set({ user: null, profile: null, loading: false })
          }
        } else {
          set({ loading: false })
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const profile = await authService.getProfile(session.user.id)
              set({ user: session.user, profile })
            } catch {
              set({ user: session.user, profile: null })
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, profile: null })
          }
        })
      },

      signIn: async (email, password) => {
        const result = await authService.signIn(email, password)
        set({ user: result.user, profile: result.profile })
        return result
      },

      signUp: async (email, password, username) => {
        return authService.signUp(email, password, username)
      },

      signOut: async () => {
        await authService.signOut()
        set({ user: null, profile: null })
      },

      updateProfile: async (updates) => {
        const { profile } = get()
        const updated = await authService.updateProfile(profile.id, updates)
        set({ profile: updated })
        return updated
      },

      isAdmin: () => get().profile?.role === 'admin',
      isAuthenticated: () => !!get().user,
    }),
    { name: 'auth-store', partialize: (state) => ({ user: state.user, profile: state.profile }) }
  )
)
