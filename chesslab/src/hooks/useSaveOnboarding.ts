import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { gameService } from '../services/gameService'
import { useAuthStore } from '../store/authStore'
import type { OnboardingFormData } from '../schemas/onboardingSchema'

const SYNC_MONTHS = 3

export const useSaveOnboarding = () => {
  const token = useAuthStore((state) => state.token)
  const setUser = useAuthStore((state) => state.setUser)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      const user = await authService.onboarding(token!, {
        chesscom_username: data.chesscom_username,
        main_goal: data.main_goal || null,
        peak_rating: data.peak_rating ? Number(data.peak_rating) : null,
      })

      let syncMessage: string | null = null
      try {
        const sync = await gameService.syncGames(token!, SYNC_MONTHS)
        syncMessage = sync.message
      } catch {
        // o onboarding fica concluído mesmo que o import falhe;
        // o utilizador pode sincronizar mais tarde
      }

      return { user, syncMessage }
    },
    onSuccess: ({ user }) => {
      setUser(user)
      queryClient.setQueryData(['me'], user)
      navigate('/')
    },
  })
}
