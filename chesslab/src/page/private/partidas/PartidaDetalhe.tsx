import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { gameService } from '../../../services/gameService'
import { useAuthStore } from '../../../store/authStore'
import '../../../styles/dashboard.css'
import './PartidaDetalhe.css'

const RESULT_LABEL: Record<string, string> = {
  win: 'Vitória',
  loss: 'Derrota',
  draw: 'Empate',
}

function extractSans(pgn: string): string[] {
  const body = pgn.replace(/\[[^\]]*\]/g, ' ')
  const cleaned = body
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d+\.(\.\.)?/g, ' ')
    .replace(/(1-0|0-1|1\/2-1\/2|\*)/g, ' ')
  return cleaned.split(/\s+/).filter((token) => token.length > 1 && /[a-zA-Z]/.test(token))
}

export const PartidaDetalhe = () => {
  const { gameId } = useParams()
  const token = useAuthStore((state) => state.token)
  const [ply, setPly] = useState(0)

  const { data: game, isLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gameService.getGame(token!, gameId!),
    enabled: !!token && !!gameId,
  })

  const positions = useMemo(() => {
    const chess = new Chess()
    const fens = [chess.fen()]
    if (!game?.pgn) return fens
    for (const san of extractSans(game.pgn)) {
      try {
        chess.move(san)
        fens.push(chess.fen())
      } catch {
        break
      }
    }
    return fens
  }, [game])

  // reinicia o replay quando muda de partida (padrão de reset durante o render)
  const [previousGameId, setPreviousGameId] = useState(gameId)
  if (previousGameId !== gameId) {
    setPreviousGameId(gameId)
    setPly(0)
  }

  const safePly = Math.min(ply, positions.length - 1)
  const fen = positions[safePly]

  if (isLoading) {
    return <div className="page"><p>A carregar partida...</p></div>
  }

  if (!game) {
    return (
      <div className="page">
        <p className="muted">Partida não encontrada.</p>
        <Link to="/partidas" className="btn-secondary">Voltar às partidas</Link>
      </div>
    )
  }

  const orientation = game.color === 'black' ? 'black' : 'white'

  return (
    <div className="page">
      <Link to="/partidas" className="back-link">← Partidas</Link>

      <h1 className="page-title detail-title">
        vs {game.opponent_username ?? '—'}
        <span className={`game-result-text ${game.result ?? ''}`}>
          {RESULT_LABEL[game.result ?? ''] ?? '—'}
        </span>
      </h1>

      <p className="page-subtitle">
        {game.time_class ?? '—'} · {game.player_rating ?? '?'} vs{' '}
        {game.opponent_rating ?? '?'}
        {game.opening_eco ? ` · ${game.opening_eco}` : ''}
        {game.opening_name ? ` · ${game.opening_name}` : ''}
      </p>

      <div className="detail-layout">
        <div className="card detail-board">
          <Chessboard
            options={{
              id: `game-${game.id}`,
              position: fen,
              boardOrientation: orientation,
              allowDragging: false,
              allowDrawingArrows: false,
              animationDurationInMs: 160,
            }}
          />

          <div className="replay-controls">
            <button onClick={() => setPly(0)} disabled={safePly === 0} aria-label="Início">
              <ChevronFirst size={18} />
            </button>
            <button
              onClick={() => setPly((p) => Math.max(0, p - 1))}
              disabled={safePly === 0}
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="replay-counter">{safePly}/{positions.length - 1}</span>
            <button
              onClick={() => setPly((p) => Math.min(positions.length - 1, p + 1))}
              disabled={safePly >= positions.length - 1}
              aria-label="Seguinte"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setPly(positions.length - 1)}
              disabled={safePly >= positions.length - 1}
              aria-label="Fim"
            >
              <ChevronLast size={18} />
            </button>
          </div>
        </div>

        <div className="card detail-moves">
          <h2 className="card-title">Lances</h2>
          <div className="move-grid">
            {extractSans(game.pgn).map((san, i) => (
              <button
                key={`${san}-${i}`}
                className={`move-cell${i + 1 === safePly ? ' current' : ''}`}
                onClick={() => setPly(i + 1)}
              >
                {i % 2 === 0 && <span className="move-number">{Math.floor(i / 2) + 1}.</span>}
                {san}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
