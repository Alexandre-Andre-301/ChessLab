import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gameService } from '../services/gameService'
import { useAuthStore } from '../store/authStore'

const SYNC_MONTHS = 3

export const useSyncGames = () => {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => gameService.syncGames(token!, SYNC_MONTHS),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opening-stats'] })
      queryClient.invalidateQueries({ queryKey: ['rating-history'] })
    },
  })
}
