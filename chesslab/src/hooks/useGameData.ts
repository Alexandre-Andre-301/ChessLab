import { useQuery } from '@tanstack/react-query'
import { gameService, type GameFilters } from '../services/gameService'
import { insightService } from '../services/insightService'
import { useAuthStore } from '../store/authStore'

export const useGames = (filters: GameFilters, limit = 20, offset = 0) => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['games', filters, limit, offset],
    queryFn: () => gameService.listGames(token!, filters, limit, offset),
    enabled: !!token,
    placeholderData: (previous) => previous,
  })
}

export const useGameDetail = (gameId: string) => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gameService.getGame(token!, gameId),
    enabled: !!token && !!gameId,
  })
}

export const usePerformance = () => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['performance'],
    queryFn: () => gameService.getPerformance(token!),
    enabled: !!token,
  })
}

export const useInsights = () => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['insights'],
    queryFn: () => insightService.getInsights(token!),
    enabled: !!token,
  })
}
