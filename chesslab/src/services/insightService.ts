import { apiFetch } from './api'
import type { InsightItem } from '../types/api'

export const insightService = {
  getInsights(token: string): Promise<InsightItem[]> {
    return apiFetch<InsightItem[]>('/insights', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
