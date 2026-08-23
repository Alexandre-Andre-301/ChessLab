import { apiFetch } from './api'
import type {
  AnswerResult,
  FamilyStat,
  GenerateResult,
  LineCheckResult,
  LineSession,
  ReviewCardSummary,
  TrainingOverview,
} from '../types/api'

export const trainingService = {
  generate(token: string): Promise<GenerateResult> {
    return apiFetch<GenerateResult>('/training/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  overview(token: string): Promise<TrainingOverview> {
    return apiFetch<TrainingOverview>('/training/overview', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  families(token: string): Promise<FamilyStat[]> {
    return apiFetch<FamilyStat[]>('/training/families', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  lineSession(token: string, family: string, color: 'white' | 'black'): Promise<LineSession> {
    const params = new URLSearchParams({ family, color })
    return apiFetch<LineSession>(`/training/line-session?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  checkLineMove(
    token: string,
    bookId: number,
    ply: number,
    uci: string,
    color: 'white' | 'black',
  ): Promise<LineCheckResult> {
    return apiFetch<LineCheckResult>('/training/line-session/check', {
      method: 'POST',
      body: { book_id: bookId, ply, uci, color },
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  dueCards(
    token: string,
    cardType: 'opening' | 'puzzle',
    limit = 10,
    family?: string,
  ): Promise<ReviewCardSummary[]> {
    const params = new URLSearchParams({ card_type: cardType, limit: String(limit) })
    if (family) params.set('family', family)
    return apiFetch<ReviewCardSummary[]>(`/training/due?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  answerCard(token: string, cardId: string, moveUci: string): Promise<AnswerResult> {
    return apiFetch<AnswerResult>(`/training/cards/${cardId}/answer`, {
      method: 'POST',
      body: { move_uci: moveUci },
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
