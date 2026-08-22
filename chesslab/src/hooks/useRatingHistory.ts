import { useQuery } from '@tanstack/react-query'
import { gameService } from '../services/gameService'
import { useAuthStore } from '../store/authStore'

export const useRatingHistory = (timeClass?: string) => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['rating-history', timeClass ?? 'todas'],
    queryFn: () => gameService.getRatingHistory(token!, timeClass),
    enabled: !!token,
  })
}
