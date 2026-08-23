import { apiFetch } from './api'
import type { BookLine } from '../types/api'

export const openingService = {
  getBookLines(token: string, family: string, limit = 4): Promise<BookLine[]> {
    const params = new URLSearchParams({ family, limit: String(limit) })
    return apiFetch<BookLine[]>(`/openings/book?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
