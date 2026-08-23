import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Eye, Flame, History, RotateCcw, XCircle } from 'lucide-react'
import { trainingService } from '../../services/trainingService'
import { useAuthStore } from '../../store/authStore'
import type { AnswerResult, ReviewCardSummary } from '../../types/api'
import './TrainingSession.css'

interface TrainingSessionProps {
  type: 'opening' | 'puzzle'
  cards: ReviewCardSummary[]
  streakDays?: number
  familyName?: string
  onFinish: () => void
}

const fullFen = (fen: string) =>
  fen.split(' ').length >= 6 ? fen : `${fen} 0 1`

const REPLAY_STEP_MS = 450

export const TrainingSession = ({
  type,
  cards,
  streakDays,
  familyName,
  onFinish,
}: TrainingSessionProps) => {
  const token = useAuthStore((state) => state.token)
  const [index, setIndex] = useState(0)
  const [lastAnswer, setLastAnswer] = useState<AnswerResult | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [replaying, setReplaying] = useState(false)
  const [displayFen, setDisplayFen] = useState<string | null>(null)
  const replayTimer = useRef<number | null>(null)

  const card = cards[index]
  const orientation = card?.fen.split(' ')[1] === 'b' ? 'black' : 'white'

  const game = useMemo(
    () => (card ? new Chess(fullFen(card.fen)) : null),
    [card],
  )

  const linePositions = useMemo(() => {
    if (!card || card.line_moves.length === 0) return []
    const chess = new Chess()
    const positions = [chess.fen()]
    for (const san of card.line_moves) {
      try {
        chess.move(san)
        positions.push(chess.fen())
      } catch {
        break
      }
    }
    return positions
  }, [card])

  useEffect(() => {
    return () => {
      if (replayTimer.current) window.clearInterval(replayTimer.current)
    }
  }, [])

  const advance = () => {
    setLastAnswer(null)
    setIndex((i) => i + 1)
  }

  const handleAnswer = (answer: AnswerResult) => {
    setLastAnswer(answer)
    setResults((prev) => [...prev, answer.correct])

    if (answer.correct) {
      // acertou: avanço rápido, sem interromper o ritmo
      setTimeout(advance, 850)
    }
    // errou: fica no ecrã para ler a explicação; "Continuar" avança
  }

  const startReplay = () => {
    if (linePositions.length === 0 || replaying) return

    setReplaying(true)
    setDisplayFen(linePositions[0])
    let step = 1

    replayTimer.current = window.setInterval(() => {
      if (step >= linePositions.length) {
        if (replayTimer.current) window.clearInterval(replayTimer.current)
        setDisplayFen(null)
        setReplaying(false)
        return
      }
      setDisplayFen(linePositions[step])
      step += 1
    }, REPLAY_STEP_MS)
  }

  const handleMove = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (lastAnswer || replaying || !targetSquare || !card) return false

    let uci: string
    try {
      const move = game!.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
      if (!move) return false
      uci = `${move.from}${move.to}${move.promotion ?? ''}`
    } catch {
      return false
    }

    void trainingService.answerCard(token!, card.id, uci)
      .then((answer) => handleAnswer(answer))
      .catch(() => {
        setResults((prev) => [...prev, false])
        setLastAnswer({
          correct: false,
          correct_move: '—',
          interval_days: 0,
          next_review_at: '',
          message: 'Erro de ligação. Este cartão conta como falhado.',
        })
      })

    return true
  }

  if (!card || !game) {
    return (
      <SessionSummary
        type={type}
        results={results}
        streakDays={streakDays}
        onRepeat={() => {
          setResults([])
          setIndex(0)
          setLastAnswer(null)
        }}
        onFinish={onFinish}
      />
    )
  }

  const correctCount = results.filter(Boolean).length
  const answered = results.length
  const sideToMove = card.fen.split(' ')[1] === 'b' ? 'pretas' : 'brancas'

  return (
    <div className="training-session">
      <div className="session-topbar">
        <button className="session-exit" onClick={onFinish} aria-label="Sair da sessão">
          <ArrowLeft size={17} />
        </button>

        <div className="session-title">
          <span className="session-kind">
            {type === 'opening' ? 'Flashcards' : 'Puzzles'}
          </span>
          {familyName && <span className="session-family">{familyName}</span>}
        </div>

        {streakDays !== undefined && streakDays > 0 && (
          <span className="streak-badge">
            <Flame size={14} /> {streakDays}
          </span>
        )}
      </div>

      <div className="segment-progress" role="progress">
        {cards.map((_, i) => (
          <span
            key={i}
            className={`segment${i < results.length ? (results[i] ? ' ok' : ' ko') : ''}${
              i === index ? ' current' : ''
            }`}
          />
        ))}
      </div>

      <div className="position-meta">
        <span className={`side-chip ${sideToMove}`}>
          <span className="side-dot" />
          Jogam as {sideToMove}
        </span>
        {card.opening_eco && <span className="openings-eco">{card.opening_eco}</span>}
        {card.occurrences > 1 && (
          <span className="occurrences-note">em {card.occurrences} dos teus jogos</span>
        )}
      </div>

      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="session-board"
      >
        <Chessboard
          options={{
            id: `training-${card.id}`,
            position: displayFen ?? fullFen(card.fen),
            boardOrientation: orientation,
            onPieceDrop: handleMove,
            animationDurationInMs: 180,
            allowDragging: !replaying && !lastAnswer,
            allowDrawingArrows: false,
          }}
        />
      </motion.div>

      <div className="session-actions">
        {card.line_moves.length > 0 && !replaying && !lastAnswer && (
          <button className="context-btn" onClick={startReplay}>
            <Eye size={14} /> Ver como se chegou aqui
          </button>
        )}
        {replaying && (
          <span className="context-btn replaying">
            <History size={14} /> A reproduzir a linha...
          </span>
        )}
      </div>

      <div className="feedback-area">
        {lastAnswer ? (
          <motion.div
            className={`feedback-banner ${lastAnswer.correct ? 'ok' : 'ko'}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="feedback-main">
              {lastAnswer.correct ? (
                <>
                  <CheckCircle2 size={17} />
                  <strong>Certo!</strong>
                  {lastAnswer.interval_days > 0 && (
                    <span className="feedback-interval">volta em {lastAnswer.interval_days}d</span>
                  )}
                </>
              ) : (
                <>
                  <XCircle size={17} />
                  <strong>Era {lastAnswer.correct_move}</strong>
                </>
              )}
            </div>
            {!lastAnswer.correct && lastAnswer.message && (
              <p className="feedback-explain">{lastAnswer.message}</p>
            )}
            {!lastAnswer.correct && (
              <button className="btn-primary feedback-continue" onClick={advance}>
                Continuar
              </button>
            )}
          </motion.div>
        ) : (
          <p className="session-hint">
            {type === 'opening'
              ? 'Joga o teu lance habitual nesta posição:'
              : 'Encontra a melhor jogada:'}
          </p>
        )}
      </div>

      <div className="session-footer">
        <span className="session-counter">
          {Math.min(index + 1, cards.length)} / {cards.length}
        </span>
        {answered > 0 && (
          <span className="session-score-mini">
            {correctCount}/{answered} à primeira
          </span>
        )}
      </div>
    </div>
  )
}

const SessionSummary = ({
  type,
  results,
  streakDays,
  onRepeat,
  onFinish,
}: {
  type: 'opening' | 'puzzle'
  results: boolean[]
  streakDays?: number
  onRepeat: () => void
  onFinish: () => void
}) => {
  const correct = results.filter(Boolean).length
  const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0

  const message =
    accuracy === 100
      ? 'Impecável! Estes cartões vão descansar.'
      : accuracy >= 70
        ? 'Bom trabalho — os falhados voltam mais cedo.'
        : 'Os errados voltam hoje. É assim que se fixa.'

  return (
    <motion.div
      className="session-summary"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <p className="summary-kind">{type === 'opening' ? 'Flashcards' : 'Puzzles'}</p>
      <h2>Sessão concluída</h2>

      <div className="summary-accuracy">
        <span className="summary-pct">{accuracy}%</span>
        <span className="summary-detail">
          {correct} de {results.length} à primeira
        </span>
      </div>

      <p className="summary-message">{message}</p>

      {streakDays !== undefined && streakDays > 0 && (
        <span className="streak-badge summary-streak">
          <Flame size={14} /> streak de {streakDays} {streakDays === 1 ? 'dia' : 'dias'}
        </span>
      )}

      <div className="guided-summary-actions">
        {results.some((r) => !r) && (
          <button className="btn-secondary" onClick={onRepeat}>
            <RotateCcw size={15} />
            Repetir sessão
          </button>
        )}
        <button className="btn-primary" onClick={onFinish}>
          Concluir
        </button>
      </div>
    </motion.div>
  )
}
