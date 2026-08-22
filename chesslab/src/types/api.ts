export interface RegisterRequest {
  full_name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface OnboardingRequest {
  chesscom_username: string
  main_goal?: string | null
  peak_rating?: number | null
}

export interface SyncResponse {
  games_found: number
  games_imported: number
  message: string
}

export interface OpeningStat {
  opening_eco: string
  opening_name: string
  games_played: number
  wins: number
  losses: number
  draws: number
  win_rate: number
}

export interface RatingPoint {
  played_at: string
  player_rating: number
}

export interface TrainingOverview {
  opening: { total: number; due: number }
  puzzle: { total: number; due: number }
}

export interface GenerateResult {
  opening_cards: number
  puzzle_cards: number
}

export interface ReviewCardSummary {
  id: string
  card_type: 'opening' | 'puzzle'
  fen: string
  opening_eco: string | null
  repetitions: number
  interval_days: number
}

export interface AnswerResult {
  correct: boolean
  correct_move: string
  interval_days: number
  next_review_at: string
}

export interface User {
  id: string
  full_name: string
  email: string
  chesscom_username: string | null
  main_goal: string | null
  peak_rating: number | null
  onboarding_completed: boolean
  created_at: string
}
