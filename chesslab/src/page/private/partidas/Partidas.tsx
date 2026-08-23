import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useGames } from '../../../hooks/useGameData'
import type { GameSummary } from '../../../types/api'
import type { GameFilters } from '../../../services/gameService'
import '../../../styles/dashboard.css'

const PAGE_SIZE = 20

const RESULT_LABEL: Record<string, string> = {
  win: 'Vitória',
  loss: 'Derrota',
  draw: 'Empate',
}

const GameRow = ({ game }: { game: GameSummary }) => (
  <Link to={`/partidas/${game.id}`} className="game-row">
    <div className="game-main">
      <span className={`game-result-badge ${game.result}`}>
        {game.result === 'win' ? '1-0' : game.result === 'loss' ? '0-1' : '½-½'}
      </span>
      <div className="game-info">
        <span className="game-opponent">vs {game.opponent_username ?? '—'}</span>
        <span className="game-sub">
          {game.time_class ?? '—'} ·{' '}
          {game.player_rating ?? '?'} vs {game.opponent_rating ?? '?'}
          {game.opening_eco ? ` · ${game.opening_eco}` : ''}
        </span>
      </div>
    </div>
    <div className="game-side">
      <span className={`game-result-text ${game.result}`}>{RESULT_LABEL[game.result ?? ''] ?? '—'}</span>
      <ChevronRight size={16} />
    </div>
  </Link>
)

export const Partidas = () => {
  const [filters, setFilters] = useState<GameFilters>({})
  const [offset, setOffset] = useState(0)
  const [previousGames, setPreviousGames] = useState<GameSummary[]>([])

  const query = useGames(filters, PAGE_SIZE, offset)
  const { isLoading, isFetching } = query

  // acumula páginas para o "carregar mais"; placeholderData mantém dados ao filtrar
  const allGames =
    offset > 0 ? [...previousGames, ...(query.data ?? [])] : query.data ?? []

  const applyFilter = (patch: Partial<GameFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setOffset(0)
    setPreviousGames([])
  }

  const hasMore = (query.data?.length ?? 0) === PAGE_SIZE

  return (
    <div className="page">
      <h1 className="page-title">Partidas</h1>
      <p className="page-subtitle">{allGames.length} partidas importadas dos últimos meses.</p>

      <div className="filter-bar">
        <select
          className="form-select filter-select"
          value={filters.result ?? ''}
          onChange={(e) => applyFilter({ result: e.target.value || undefined })}
        >
          <option value="">Todos os resultados</option>
          <option value="win">Vitórias</option>
          <option value="loss">Derrotas</option>
          <option value="draw">Empates</option>
        </select>

        <select
          className="form-select filter-select"
          value={filters.time_class ?? ''}
          onChange={(e) => applyFilter({ time_class: e.target.value || undefined })}
        >
          <option value="">Todos os ritmos</option>
          <option value="bullet">Bullet</option>
          <option value="blitz">Blitz</option>
          <option value="rapid">Rápido</option>
        </select>

        <select
          className="form-select filter-select"
          value={filters.color ?? ''}
          onChange={(e) => applyFilter({ color: e.target.value || undefined })}
        >
          <option value="">Ambas as cores</option>
          <option value="white">Brancas</option>
          <option value="black">Pretas</option>
        </select>
      </div>

      <div className="card games-card">
        {isLoading || isFetching ? (
          <p>A carregar...</p>
        ) : allGames.length === 0 ? (
          <p className="muted">Nenhuma partida com estes filtros.</p>
        ) : (
          <>
            {allGames.map((game) => (
              <GameRow key={game.id} game={game} />
            ))}

            {hasMore && (
              <button
                className="btn-secondary load-more"
                onClick={() => setOffset(allGames.length)}
              >
                Carregar mais
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
