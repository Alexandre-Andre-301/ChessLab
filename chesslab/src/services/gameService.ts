import { apiFetch } from './api'
import type {
  GameDetail,
  GameSummary,
  OpeningStat,
  RatingPoint,
  SyncResponse,
  TimeClassStat,
} from '../types/api'

export interface GameFilters {
  result?: string
  time_class?: string
  color?: string
}

export const gameService = {
  syncGames(token: string, months: number): Promise<SyncResponse> {
    return apiFetch<SyncResponse>(`/sync/chesscom?months=${months}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  listGames(token: string, filters: GameFilters = {}, limit = 20, offset = 0): Promise<GameSummary[]> {
    const params = new URLSearchParams()
    if (filters.result) params.set('result', filters.result)
    if (filters.time_class) params.set('time_class', filters.time_class)
    if (filters.color) params.set('color', filters.color)
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    return apiFetch<GameSummary[]>(`/games?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  getGame(token: string, gameId: string): Promise<GameDetail> {
    return apiFetch<GameDetail>(`/games/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  getPerformance(token: string): Promise<TimeClassStat[]> {
    return apiFetch<TimeClassStat[]>('/games/stats/performance', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  getOpeningStats(token: string): Promise<OpeningStat[]> {
    return apiFetch<OpeningStat[]>('/games/openings/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  getRatingHistory(token: string, timeClass?: string): Promise<RatingPoint[]> {
    const query = timeClass ? `?time_class=${timeClass}` : ''
    return apiFetch<RatingPoint[]>(`/games/rating/history${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
