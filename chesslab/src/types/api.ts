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
  streak_days?: number
}

export interface FamilyStat {
  family: string
  eco: string | null
  total: number
  due: number
}

export interface BookLine {
  eco: string
  name: string
  family: string
  uci_moves: string[]
  san_line: string[]
}

export interface LineSession {
  book_id: number
  eco: string
  name: string
  family: string
  user_color: 'white' | 'black'
  san_moves: string[]
  uci_moves: string[]
}

export interface LineCheckResult {
  status: 'book' | 'engine_ok' | 'wrong' | 'illegal'
  message?: string | null
  next_uci?: string | null
  best_san?: string
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
  occurrences: number
  line_moves: string[]
  explanation: string | null
}

export interface AnswerResult {
  correct: boolean
  correct_move: string
  interval_days: number
  next_review_at: string
  streak_days?: number
  message?: string | null
}

export interface GameSummary {
  id: string
  time_class: string | null
  color: string | null
  result: string | null
  opening_eco: string | null
  opening_name: string | null
  player_rating: number | null
  opponent_rating: number | null
  opponent_username: string | null
  played_at: string | null
}

export interface GameDetail extends GameSummary {
  pgn: string
}

export interface TimeClassStat {
  time_class: string
  games: number
  wins: number
  losses: number
  draws: number
  win_rate: number
}

export interface InsightItem {
  kind: 'weakness' | 'strength' | 'trend' | 'pattern'
  title: string
  message: string
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
