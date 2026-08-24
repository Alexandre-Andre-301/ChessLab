import { apiFetch } from './api'
import type {
  AnswerResult,
  BrowseCard,
  FamilyStat,
  GenerateResult,
  HintResult,
  LineCheckResult,
  LineCompleteResult,
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
    playedUci: string[],
    uci: string,
    color: 'white' | 'black',
    opponent: 'book' | 'human' = 'book',
  ): Promise<LineCheckResult> {
    return apiFetch<LineCheckResult>('/training/line-session/check', {
      method: 'POST',
      body: { book_id: bookId, played_uci: playedUci, uci, color, opponent },
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  completeLine(
    token: string,
    bookId: number,
    mistakes: number,
    color: 'white' | 'black',
  ): Promise<LineCompleteResult> {
    return apiFetch<LineCompleteResult>('/training/line-session/complete', {
      method: 'POST',
      body: { book_id: bookId, mistakes, color },
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  dueCards(
    token: string,
    cardType: 'opening' | 'puzzle',
    limit = 10,
    family?: string,
    color?: 'white' | 'black',
  ): Promise<ReviewCardSummary[]> {
    const params = new URLSearchParams({ card_type: cardType, limit: String(limit) })
    if (family) params.set('family', family)
    if (color) params.set('color', color)
    return apiFetch<ReviewCardSummary[]>(`/training/due?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  answerCard(
    token: string,
    cardId: string,
    moveUci: string,
    hinted = false,
  ): Promise<AnswerResult> {
    return apiFetch<AnswerResult>(`/training/cards/${cardId}/answer`, {
      method: 'POST',
      body: { move_uci: moveUci, hinted },
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  cardHint(token: string, cardId: string): Promise<HintResult> {
    return apiFetch<HintResult>(`/training/cards/${cardId}/hint`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  cardReveal(token: string, cardId: string): Promise<{ correct_move: string }> {
    return apiFetch<{ correct_move: string }>(`/training/cards/${cardId}/reveal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  browse(
    token: string,
    cardType: 'opening' | 'puzzle',
    family?: string,
  ): Promise<BrowseCard[]> {
    const params = new URLSearchParams({ card_type: cardType })
    if (family) params.set('family', family)
    return apiFetch<BrowseCard[]>(`/training/browse?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
