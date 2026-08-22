import { apiFetch } from './api'
import type {
  AnswerResult,
  GenerateResult,
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

  dueCards(token: string, cardType: 'opening' | 'puzzle', limit = 10): Promise<ReviewCardSummary[]> {
    return apiFetch<ReviewCardSummary[]>(
      `/training/due?card_type=${cardType}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
  },

  answerCard(token: string, cardId: string, moveUci: string): Promise<AnswerResult> {
    return apiFetch<AnswerResult>(`/training/cards/${cardId}/answer`, {
      method: 'POST',
      body: { move_uci: moveUci },
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
