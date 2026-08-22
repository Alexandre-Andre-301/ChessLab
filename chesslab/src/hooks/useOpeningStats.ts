import { useQuery } from '@tanstack/react-query'
import { gameService } from '../services/gameService'
import { useAuthStore } from '../store/authStore'

export const useOpeningStats = () => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['opening-stats'],
    queryFn: () => gameService.getOpeningStats(token!),
    enabled: !!token,
  })
}
