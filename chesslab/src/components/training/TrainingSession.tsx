import { useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { motion } from 'framer-motion'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { trainingService } from '../../services/trainingService'
import { useAuthStore } from '../../store/authStore'
import type { AnswerResult, ReviewCardSummary } from '../../types/api'
import './TrainingSession.css'

interface TrainingSessionProps {
  type: 'opening' | 'puzzle'
  cards: ReviewCardSummary[]
  onFinish: () => void
}

const fullFen = (fen: string) =>
  fen.split(' ').length >= 6 ? fen : `${fen} 0 1`

export const TrainingSession = ({ type, cards, onFinish }: TrainingSessionProps) => {
  const token = useAuthStore((state) => state.token)
  const [index, setIndex] = useState(0)
  const [lastAnswer, setLastAnswer] = useState<AnswerResult | null>(null)
  const [wrong, setWrong] = useState(false)
  const [results, setResults] = useState<boolean[]>([])

  const card = cards[index]
  const orientation = card?.fen.split(' ')[1] === 'b' ? 'black' : 'white'

  // chess.js valida legalidade localmente antes de enviar ao backend
  const game = useMemo(
    () => (card ? new Chess(fullFen(card.fen)) : null),
    [card],
  )

  if (!card || !game) {
    const correct = results.filter(Boolean).length
    return (
      <motion.div
        className="session-summary"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2>Sessão concluída</h2>
        <p className="session-score">
          {correct} / {results.length} à primeira
        </p>
        <button className="btn-primary" onClick={onFinish}>
          <RotateCcw size={16} />
          Voltar ao treino
        </button>
      </motion.div>
    )
  }

  const handleMove = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (lastAnswer || !targetSquare) return false

    let uci: string
    try {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
      if (!move) return false
      uci = `${move.from}${move.to}${move.promotion ?? ''}`
    } catch {
      return false
    }

    void trainingService.answerCard(token!, card.id, uci)
      .then((answer) => {
        setLastAnswer(answer)
        setResults((prev) => [...prev, answer.correct])

        if (answer.correct) {
          setTimeout(() => {
            setLastAnswer(null)
            setIndex((i) => i + 1)
          }, 700)
        } else {
          setWrong(true)
          setTimeout(() => {
            setWrong(false)
            setLastAnswer(null)
            setIndex((i) => i + 1)
          }, 1400)
        }
      })
      .catch(() => {
        setResults((prev) => [...prev, false])
        setIndex((i) => i + 1)
      })

    return true
  }

  const progressPct = Math.round(((index + (lastAnswer ? 0.5 : 0)) / cards.length) * 100)

  return (
    <div className="training-session">
      <div className="session-progress">
        <div className="session-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <p className={`session-hint${wrong ? ' wrong' : ''}`}>
        {type === 'opening' ? (
          wrong ? (
            <>O teu lance habitual era <strong>{lastAnswer?.correct_move}</strong></>
          ) : (
            'Joga o teu lance habitual nesta posição:'
          )
        ) : wrong ? (
          <>A melhor jogada era <strong>{lastAnswer?.correct_move}</strong></>
        ) : (
          'Encontra a melhor jogada:'
        )}
      </p>

      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`session-board${wrong ? ' board-wrong' : ''}`}
      >
        <Chessboard
          options={{
            id: `training-${card.id}`,
            position: fullFen(card.fen),
            boardOrientation: orientation,
            onPieceDrop: handleMove,
            animationDurationInMs: 180,
            allowDrawingArrows: false,
          }}
        />
      </motion.div>

      <div className="session-footer">
        <span className="session-counter">
          {index + 1} / {cards.length}
        </span>

        {lastAnswer &&
          (lastAnswer.correct ? (
            <span className="session-feedback ok">
              <CheckCircle2 size={15} /> Certo!
              {lastAnswer.interval_days > 0 && ` +${lastAnswer.interval_days}d`}
            </span>
          ) : (
            <span className="session-feedback ko">
              <XCircle size={15} /> Era {lastAnswer.correct_move}
            </span>
          ))}
      </div>
    </div>
  )
}
