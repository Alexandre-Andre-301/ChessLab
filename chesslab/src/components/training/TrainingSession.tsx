import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Flame,
  History,
  Lightbulb,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { trainingService } from '../../services/trainingService'
import { useAuthStore } from '../../store/authStore'
import { useSquareSize } from '../../hooks/useSquareSize'
import type { AnswerResult, ReviewCardSummary } from '../../types/api'

interface TrainingSessionProps {
  type: 'opening' | 'puzzle'
  cards: ReviewCardSummary[]
  streakDays?: number
  familyName?: string
  onFinish: () => void
  onReviewWeak?: (cards: ReviewCardSummary[]) => void
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
  onReviewWeak,
}: TrainingSessionProps) => {
  const token = useAuthStore((state) => state.token)
  const [queue, setQueue] = useState<ReviewCardSummary[]>(cards)
  const [index, setIndex] = useState(0)
  const [lastAnswer, setLastAnswer] = useState<AnswerResult | null>(null)
  const [awaitingRetry, setAwaitingRetry] = useState(false)
  const [firstAttemptResults, setFirstAttemptResults] = useState<boolean[]>([])
  const [masterySamples, setMasterySamples] = useState<{ before: number; after: number }[]>([])
  const [wrongFamilies, setWrongFamilies] = useState<string[]>([])
  const [wrongCardIds, setWrongCardIds] = useState<string[]>([])
  const [hintText, setHintText] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [replaying, setReplaying] = useState(false)
  const [displayFen, setDisplayFen] = useState<string | null>(null)
  const replayTimer = useRef<number | null>(null)
  const { ref: frameRef, size: boardSize } = useSquareSize(440)

  const card = queue[index]
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
    setAwaitingRetry(false)
    setHintText(null)
    setRevealed(false)
    setIndex((i) => i + 1)
  }

  const handleAnswer = (answer: AnswerResult, wasRetry: boolean) => {
    setLastAnswer(answer)
    setMasterySamples((prev) => [
      ...prev,
      { before: answer.mastery_before, after: answer.mastery },
    ])

    if (!answer.correct) {
      setFirstAttemptResults((prev) => [...prev, false])
      if (card) {
        const wrongFamily = card.family ?? '—'
        setWrongFamilies((prev) =>
          prev.includes(wrongFamily) ? prev : [...prev, wrongFamily],
        )
        setWrongCardIds((prev) =>
          prev.includes(card.id) ? prev : [...prev, card.id],
        )
      }
      return
    }

    setFirstAttemptResults((prev) => [...prev, !wasRetry])
    if (answer.correct) setTimeout(advance, wasRetry ? 1100 : 850)
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

    const wasRetry = awaitingRetry
    void trainingService.answerCard(token!, card.id, uci, revealed)
      .then((answer) => {
    if (wasRetry && answer.correct) {
      // §36: recuperou — mostra ✓ Recuperado e agenda para breve
      setLastAnswer({
        ...answer,
        correct: true,
        message: 'Recuperado ✓ — mas volta mais cedo para confirmar.',
      })
      setFirstAttemptResults((prev) => [...prev, false])
      setMasterySamples((prev) => [
        ...prev,
        { before: answer.mastery_before, after: answer.mastery },
      ])
      setTimeout(advance, 1400)
      return
    }
        handleAnswer(answer, wasRetry)
      })
      .catch(() => {
        setFirstAttemptResults((prev) => [...prev, false])
        setLastAnswer({
          correct: false,
          correct_move: '—',
          interval_days: 0,
          next_review_at: '',
          mastery: card.mastery,
          mastery_before: card.mastery,
          message: 'Erro de ligação. Este cartão conta como falhado.',
        })
      })

    return true
  }

  // §16-17: interleaving — errar não avança; o cartão volta daqui a 3
  const requeueCurrent = () => {
    setQueue((prev) => {
      if (prev.length < 2) return prev
      const next = [...prev]
      const [wrongCard] = next.splice(index, 1)
      const insertAt = Math.min(index + 3, next.length)
      next.splice(insertAt, 0, wrongCard)
      return next
    })
    setAwaitingRetry(true)
    setLastAnswer(null)
    setHintText(null)
    setRevealed(false)
  }

  const requestHint = () => {
    if (!card || revealed) return
    void trainingService.cardHint(token!, card.id).then((hint) => {
      setHintText(`Pensa em ${hint.piece}${hint.square_hint ? ` · ${hint.square_hint}` : ''}`)
    })
  }

  const requestReveal = () => {
    if (!card) return
    void trainingService.cardReveal(token!, card.id).then((r) => {
      setRevealed(true)
      setHintText(`O lance era ${r.correct_move} — joga-o para continuar (volta mais cedo).`)
    })
  }

  if (!card || !game) {
    const weakCards = cards.filter((c) => wrongCardIds.includes(c.id))
    return (
      <SessionSummary
        results={firstAttemptResults}
        masterySamples={masterySamples}
        wrongFamilies={wrongFamilies}
        streakDays={streakDays}
        onRepeat={() => {
          setFirstAttemptResults([])
          setMasterySamples([])
          setWrongFamilies([])
          setWrongCardIds([])
          setQueue(cards)
          setIndex(0)
          setAwaitingRetry(false)
          setLastAnswer(null)
        }}
        onReviewWeak={
          onReviewWeak && weakCards.length > 0
            ? () => onReviewWeak(weakCards)
            : undefined
        }
        onFinish={onFinish}
      />
    )
  }

  const correctCount = firstAttemptResults.filter(Boolean).length
  const sideToMove = card.fen.split(' ')[1] === 'b' ? 'pretas' : 'brancas'

  return (
    <div className="mx-auto flex h-full w-full max-w-[520px] flex-col">
      <div className="flex items-center gap-2 pb-2">
        <Button variant="outline" size="icon" className="size-8" onClick={onFinish}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="text-sm font-bold text-foreground">
            {type === 'opening' ? 'Flashcards' : 'Puzzles'}
          </span>
          {familyName && (
            <span className="truncate text-xs text-muted-foreground">{familyName}</span>
          )}
        </div>
        {streakDays !== undefined && streakDays > 0 && (
          <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600">
            <Flame className="size-3" /> {streakDays}
          </Badge>
        )}
      </div>

      <div className="flex gap-1 pb-2">
        {queue.map((qc, i) => (
          <span
            key={`${qc.id}-${i}`}
            className={`h-1.5 flex-1 rounded-full ${
              i < index
                ? 'bg-primary/60'
                : i === index
                  ? 'bg-primary ring-2 ring-primary/30'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-2">
        <Badge variant="outline" className="gap-1.5">
          <span
            className={`inline-block size-2.5 rounded-full border ${
              sideToMove === 'brancas' ? 'bg-stone-100' : 'bg-zinc-800'
            }`}
          />
          Jogam as {sideToMove}
        </Badge>
        {card.opening_eco && <Badge variant="secondary">{card.opening_eco}</Badge>}
        <Badge variant="outline" className="text-[11px]">
          domínio {card.mastery}%
        </Badge>
        {card.occurrences > 1 && (
          <span className="text-xs text-muted-foreground">
            em {card.occurrences} jogos
          </span>
        )}
      </div>

      <div ref={frameRef} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div style={{ width: boardSize, height: boardSize }} className="shrink-0">
          <motion.div
            key={`${card.id}-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className="overflow-hidden rounded-lg shadow-md"
          >
            <Chessboard
              options={{
                id: `training-${card.id}-${index}`,
                position: displayFen ?? fullFen(card.fen),
                boardOrientation: orientation,
                onPieceDrop: handleMove,
                animationDurationInMs: 180,
                allowDragging: !replaying && !lastAnswer,
                allowDrawingArrows: false,
              }}
            />
          </motion.div>
        </div>
      </div>

      <div className="flex min-h-[32px] flex-wrap items-center gap-2 pt-2">
        {card.line_moves.length > 0 && !replaying && !lastAnswer && (
          <Button variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={startReplay}>
            <Eye className="size-3.5" /> Ver como se chegou aqui
          </Button>
        )}
        {replaying && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <History className="size-3.5" /> A reproduzir a linha...
          </span>
        )}

        {!lastAnswer && !replaying && (
          <>
            {!hintText && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 rounded-full text-xs"
                onClick={requestHint}
              >
                <Lightbulb className="size-3.5 text-amber-500" /> Dica
              </Button>
            )}
            {hintText && !revealed && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 rounded-full text-xs"
                onClick={requestReveal}
              >
                <Lightbulb className="size-3.5 text-amber-500" /> Revelar lance
              </Button>
            )}
          </>
        )}
      </div>

      {(hintText || lastAnswer) && (
        <div className="flex min-h-[70px] flex-col justify-center gap-2 pt-1">
          {hintText && !lastAnswer && (
            <div className="flex items-center gap-2 rounded-lg border-l-2 border-amber-500 bg-amber-500/10 p-2.5 text-left text-xs text-foreground">
              <Lightbulb className="size-3.5 shrink-0 text-amber-500" />
              {hintText}
            </div>
          )}
          {lastAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-3.5 ${
                lastAnswer.correct ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {lastAnswer.correct ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <XCircle className="size-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    lastAnswer.correct ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {lastAnswer.correct
                    ? awaitingRetry
                      ? 'Recuperado ✓'
                      : 'Certo!'
                    : `Era ${lastAnswer.correct_move}`}
                </span>
                <Badge variant="outline" className="ml-auto text-[11px]">
                  domínio {lastAnswer.mastery_before}→{lastAnswer.mastery}%
                </Badge>
              </div>
            {!lastAnswer.correct && lastAnswer.message && (
              <p className="mt-1.5 pl-6 text-[13px] leading-snug text-muted-foreground">
                {lastAnswer.message}
              </p>
            )}
            {!lastAnswer.correct && lastAnswer.tip && (
              <p className="mt-1 pl-6 text-[12px] italic text-muted-foreground/90">
                {lastAnswer.tip}
              </p>
            )}
              {!lastAnswer.correct && (
                <div className="mt-2 ml-6 flex gap-2">
                  <Button size="sm" className="h-8" onClick={requeueCurrent}>
                    Tentar outra vez
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={advance}>
                    Avançar
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
        <span>
          {Math.min(index + 1, queue.length)} / {queue.length}
        </span>
        {firstAttemptResults.length > 0 && (
          <span className="font-semibold text-primary">
            {correctCount}/{firstAttemptResults.length} à primeira
          </span>
        )}
      </div>
    </div>
  )
}

const SessionSummary = ({
  results,
  masterySamples,
  wrongFamilies,
  streakDays,
  onRepeat,
  onReviewWeak,
  onFinish,
}: {
  results: boolean[]
  masterySamples: { before: number; after: number }[]
  wrongFamilies: string[]
  streakDays?: number
  onRepeat: () => void
  onReviewWeak?: () => void
  onFinish: () => void
}) => {
  const correct = results.filter(Boolean).length
  const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0

  const beforeAvg =
    masterySamples.length > 0
      ? Math.round(
          masterySamples.reduce((s, m) => s + m.before, 0) / masterySamples.length,
        )
      : 0
  const afterAvg =
    masterySamples.length > 0
      ? Math.round(
          masterySamples.reduce((s, m) => s + m.after, 0) / masterySamples.length,
        )
      : 0
  const delta = afterAvg - beforeAvg

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="m-auto w-full max-w-[440px] p-4"
    >
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Sessão concluída
          </p>

          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-foreground">{accuracy}%</span>
            <span className="text-sm text-muted-foreground">precisão</span>
          </div>

          {masterySamples.length > 0 && delta !== 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Domínio médio</span>
              <span className="font-semibold text-foreground">
                {beforeAvg}% → {afterAvg}%
              </span>
              <Badge className={delta > 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/10 text-red-500'}>
                {delta > 0 ? '+' : ''}{delta}
              </Badge>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {accuracy === 100
              ? 'Impecável! Estes cartões vão descansar.'
              : accuracy >= 70
                ? 'Bom trabalho — os falhados voltam mais cedo.'
                : 'Os errados voltam hoje. É assim que se fixa.'}
          </p>

          {wrongFamilies.length > 0 && (
            <div className="w-full rounded-lg bg-red-500/10 p-3 text-sm text-red-600">
              A rever: {wrongFamilies.join(', ')}
            </div>
          )}

          {streakDays !== undefined && streakDays > 0 && (
            <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600">
              <Flame className="size-3" /> streak de {streakDays}{' '}
              {streakDays === 1 ? 'dia' : 'dias'}
            </Badge>
          )}

          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {onReviewWeak && (
              <Button variant="secondary" onClick={onReviewWeak}>
                Rever posições fracas
              </Button>
            )}
            {results.some((r) => !r) && (
              <Button variant="outline" onClick={onRepeat}>
                <RotateCcw className="size-4" /> Repetir
              </Button>
            )}
            <Button onClick={onFinish}>Concluir</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
