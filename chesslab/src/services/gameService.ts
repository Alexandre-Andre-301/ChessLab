import { apiFetch } from './api'
import type { OpeningStat, RatingPoint, SyncResponse } from '../types/api'

export const gameService = {
  syncGames(token: string, months: number): Promise<SyncResponse> {
    return apiFetch<SyncResponse>(`/sync/chesscom?months=${months}`, {
      method: 'POST',
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
