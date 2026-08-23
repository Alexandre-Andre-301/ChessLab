import { useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { motion } from 'framer-motion'
import { BookOpenCheck, CheckCircle2, Cpu, RotateCcw, XCircle } from 'lucide-react'
import { trainingService } from '../../services/trainingService'
import { useAuthStore } from '../../store/authStore'
import type { LineSession } from '../../types/api'
import './GuidedLineSession.css'

interface GuidedLineSessionProps {
  session: LineSession
  onFinish: () => void
}

export const GuidedLineSession = ({ session, onFinish }: GuidedLineSessionProps) => {
  const token = useAuthStore((state) => state.token)
  const userColor = session.user_color === 'black' ? 'black' : 'white'

  // lances jÃ¡ jogados (SAN), na ordem
  const [played, setPlayed] = useState<string[]>([])
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'info' | 'ko'; text: string } | null>(null)
  const [shake, setShake] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [busy, setBusy] = useState(false)

  const game = useMemo(() => {
    const chess = new Chess()
    for (const san of played) {
      try {
        chess.move(san)
      } catch {
        break
      }
    }
    return chess
  }, [played])

  const isUserTurn = game.turn() === (userColor === 'white' ? 'w' : 'b')
  const finished = played.length >= session.san_moves.length

  const applyUserAndReply = (userSan: string, nextUci: string | null) => {
    const applied = [userSan]

    if (nextUci) {
      const reply = game.move({ from: nextUci.slice(0, 2), to: nextUci.slice(2, 4), promotion: 'q' })
      if (reply) applied.push(reply.san)
    }

    setPlayed((prev) => [...prev, ...applied])
  }

  const handleMove = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (busy || !isUserTurn || finished || !targetSquare) return false

    let uci: string
    let san: string
    try {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
      if (!move) return false
      uci = `${move.from}${move.to}${move.promotion ?? ''}`
      san = move.san
    } catch {
      return false
    }

    game.undo() // sÃ³ avanÃ§a o tabuleiro depois de o servidor validar
    setBusy(true)

    void trainingService
      .checkLineMove(token!, session.book_id, played.length, uci, userColor)
      .then((result) => {
        if (result.status === 'book') {
          setFeedback({ kind: 'ok', text: 'Lance da teoria!' })
          applyUserAndReply(san, result.next_uci ?? null)
          setTimeout(() => setFeedback(null), 900)
        } else if (result.status === 'engine_ok') {
          setFeedback({ kind: 'info', text: result.message ?? 'O Stockfish aprova.' })
          applyUserAndReply(san, result.next_uci ?? null)
          setTimeout(() => setFeedback(null), 1400)
        } else {
          setMistakes((m) => m + 1)
          setShake(true)
          setFeedback({
            kind: 'ko',
            text: result.message ?? `A teoria era ${result.best_san ?? '?'}.`,
          })
          setTimeout(() => setShake(false), 400)
        }
      })
      .catch(() => {
        setFeedback({ kind: 'ko', text: 'Erro de ligaÃ§Ã£o. Tenta de novo.' })
      })
      .finally(() => {
        setBusy(false)
      })

    return true
  }

  const resetLine = () => {
    setPlayed([])
    setFeedback(null)
    setMistakes(0)
  }

  if (finished) {
    return (
      <motion.div
        className="session-summary"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <BookOpenCheck size={40} className="stat-accent" />
        <h2>Linha dominada!</h2>
        <p className="muted">
          {session.eco} Â· {session.name}
        </p>
        <p className="guided-score">
          {session.san_moves.length} lances Â· {mistakes === 0 ? 'sem erros ðŸŽ¯' : `${mistakes} erros`}
        </p>
        <div className="guided-summary-actions">
          <button className="btn-secondary" onClick={resetLine}>
            <RotateCcw size={15} />
            Repetir
          </button>
          <button className="btn-primary" onClick={onFinish}>
            Voltar ao treino
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="training-session">
      <div className="guided-head">
        <span className="openings-eco">{session.eco}</span>
        <span className="guided-name">{session.name}</span>
      </div>

      <p className="session-hint">
        {isUserTurn
          ? `Joga as ${userColor === 'white' ? 'brancas' : 'pretas'} â€” guia-te pela teoria:`
          : 'O adversÃ¡rio responde...'}
      </p>

      <motion.div
        className={`session-board${shake ? ' board-wrong' : ''}`}
        animate={shake ? { x: [0, -7, 7, -5, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Chessboard
          options={{
            id: `line-${session.book_id}`,
            position: game.fen(),
            boardOrientation: userColor,
            onPieceDrop: handleMove,
            animationDurationInMs: 180,
            allowDragging: isUserTurn && !busy,
            allowDrawingArrows: false,
          }}
        />
      </motion.div>

      {feedback && (
        <motion.div
          key={`${feedback.text}-${played.length}`}
          className={`feedback-banner ${feedback.kind}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {feedback.kind === 'ko' ? (
            <XCircle size={15} />
          ) : feedback.kind === 'info' ? (
            <Cpu size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}
          {feedback.text}
        </motion.div>
      )}

      <div className="line-progress">
        {session.san_moves.map((san, i) => {
          const isPlayed = i < played.length
          const isUserMove = (i % 2 === 0) === (userColor === 'white')
          return (
            <span
              key={`${san}-${i}`}
              className={`line-chip${isPlayed ? ' played' : ''}${
                isPlayed && isUserMove ? ' user' : ''
              }`}
            >
              {i % 2 === 0 && <b>{i / 2 + 1}.</b>}
              {san}
            </span>
          )
        })}
      </div>

      <div className="session-footer">
        <span className="session-counter">
          {played.length} / {session.san_moves.length} lances
        </span>
        {mistakes > 0 && <span className="guided-mistakes">{mistakes} erros</span>}
      </div>
    </div>
  )
}
