import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { motion } from 'framer-motion'
import {
  BookOpenCheck,
  CheckCircle2,
  Cpu,
  Eye,
  Lock,
  RotateCcw,
  Users,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { trainingService } from '../../services/trainingService'
import { useAuthStore } from '../../store/authStore'
import { useSquareSize } from '../../hooks/useSquareSize'
import type { LineSession } from '../../types/api'

interface GuidedLineSessionProps {
  session: LineSession
  onFinish: () => void
}

const REPLAY_STEP_MS = 450

export const GuidedLineSession = ({ session, onFinish }: GuidedLineSessionProps) => {
  const token = useAuthStore((state) => state.token)
  const userColor = session.user_color === 'black' ? 'black' : 'white'
  const [opponent, setOpponent] = useState<'book' | 'human'>('book')

  const totalPlies = session.san_moves.length
  const [unlocked, setUnlocked] = useState(session.unlocked_plies)
  const trainUpTo = Math.min(unlocked, totalPlies)

  const [played, setPlayed] = useState<string[]>([])
  const [playedUci, setPlayedUci] = useState<string[]>([])
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'info' | 'ko'; text: string } | null>(null)
  const [tip, setTip] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)
  const [demoFen, setDemoFen] = useState<string | null>(null)
  const [demoing, setDemoing] = useState(false)
  const [completed, setCompleted] = useState<{ leveledUp: boolean; unlockedPlies: number } | null>(null)
  const demoTimer = useRef<number | null>(null)
  const { ref: frameRef, size: boardSize } = useSquareSize(440)

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

  const demoPositions = useMemo(() => {
    const chess = new Chess()
    const positions = [chess.fen()]
    for (let i = 0; i < trainUpTo; i++) {
      try {
        chess.move(session.san_moves[i])
        positions.push(chess.fen())
      } catch {
        break
      }
    }
    return positions
  }, [session, trainUpTo])

  useEffect(() => {
    return () => {
      if (demoTimer.current) window.clearInterval(demoTimer.current)
    }
  }, [])

  const waitingUser =
    (game.turn() === 'w' && userColor === 'white') ||
    (game.turn() === 'b' && userColor === 'black')

  const finished = played.length >= trainUpTo
  const levelNumber = Math.floor((trainUpTo - 1) / session.level_plies) + 1

  const startDemo = () => {
    if (demoing || busy) return
    setDemoing(true)
    setDemoFen(demoPositions[0])
    let step = 1
    demoTimer.current = window.setInterval(() => {
      if (step >= demoPositions.length) {
        if (demoTimer.current) window.clearInterval(demoTimer.current)
        setDemoFen(null)
        setDemoing(false)
        return
      }
      setDemoFen(demoPositions[step])
      step += 1
    }, REPLAY_STEP_MS)
  }

  const applyUserAndReply = (userSan: string, userUci: string, nextUci: string | null): number => {
    const appliedSan = [userSan]
    const appliedUci = [userUci]
    if (nextUci) {
      try {
        const reply = game.move({
          from: nextUci.slice(0, 2),
          to: nextUci.slice(2, 4),
          promotion: 'q',
        })
        if (reply) {
          appliedSan.push(reply.san)
          appliedUci.push(nextUci)
        }
      } catch {
        // resposta inválida: fica só o lance do utilizador
      }
    }
    setPlayed((prev) => [...prev, ...appliedSan])
    setPlayedUci((prev) => [...prev, ...appliedUci])
    return appliedSan.length
  }

  const finishLevel = (totalMistakes: number) => {
    setBusy(true)
    void trainingService
      .completeLine(token!, session.book_id, totalMistakes, userColor)
      .then((result) => {
        setCompleted({ leveledUp: result.leveled_up, unlockedPlies: result.unlocked_plies })
      })
      .catch(() => {
        setFeedback({ kind: 'ko', text: 'Erro de ligação ao guardar o progresso.' })
      })
      .finally(() => setBusy(false))
  }

  const handleMove = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (busy || !waitingUser || finished || demoing || !targetSquare) return false

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

    game.undo()
    setBusy(true)

    void trainingService
      .checkLineMove(token!, session.book_id, playedUci, uci, userColor, opponent)
      .then((result) => {
        if (result.tip) setTip(result.tip)

        if (result.status === 'book') {
          setFeedback({ kind: 'ok', text: 'Lance da teoria!' })
          const applied = applyUserAndReply(san, uci, result.next_uci ?? null)
          setTimeout(() => setFeedback(null), 800)
          if (played.length + applied >= trainUpTo) finishLevel(mistakes)
        } else if (result.status === 'engine_ok') {
          setFeedback({ kind: 'info', text: result.message ?? 'O Stockfish aprova.' })
          const applied = applyUserAndReply(san, uci, result.next_uci ?? null)
          setTimeout(() => setFeedback(null), 1300)
          if (played.length + applied >= trainUpTo) finishLevel(mistakes)
        } else {
          setMistakes((m) => m + 1)
          setShake(true)
          setTimeout(() => setShake(false), 400)
          setFeedback({
            kind: 'ko',
            text: result.message ?? `A teoria era ${result.best_san ?? '?'}.`,
          })
        }
      })
      .catch(() => {
        setFeedback({ kind: 'ko', text: 'Erro de ligação. Tenta de novo.' })
      })
      .finally(() => setBusy(false))

    return true
  }

  const resetBoard = () => {
    setPlayed([])
    setPlayedUci([])
    setMistakes(0)
    setFeedback(null)
    setTip(null)
  }

  if (completed) {
    const perfect = mistakes === 0
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="m-auto w-full max-w-[420px] p-4"
      >
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div
              className={`flex size-14 items-center justify-center rounded-full ${
                perfect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
              }`}
            >
              {perfect ? <BookOpenCheck className="size-7" /> : <RotateCcw className="size-7" />}
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">
                {perfect ? 'Nível dominado!' : 'Quase!'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {session.eco} · lances 1–{trainUpTo} ·{' '}
                {mistakes === 0 ? 'sem erros 🎯' : `${mistakes} ${mistakes === 1 ? 'erro' : 'erros'}`}
              </p>
            </div>

            {completed.leveledUp ? (
              <div className="w-full rounded-xl bg-emerald-500/10 p-4">
                <p className="font-semibold text-emerald-700">Novos lances desbloqueados!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Agora treinas até ao lance {Math.min(completed.unlockedPlies, totalPlies)} de{' '}
                  {totalPlies}.
                </p>
                <Button className="mt-3 w-full" onClick={continueToNextLevelFactory()}>
                  Continuar para o nível seguinte
                </Button>
              </div>
            ) : (
              <div className="w-full rounded-xl bg-amber-500/10 p-4">
                <p className="font-medium text-amber-700">
                  Repete o nível para fixar a linha na memória muscular.
                </p>
                <Button className="mt-3 w-full" onClick={repeatLevel}>
                  Repetir nível
                </Button>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={onFinish}>
              Sair do treino
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  function continueToNextLevelFactory() {
    return () => {
      setUnlocked(completed?.unlockedPlies ?? unlocked)
      setCompleted(null)
      resetBoard()
    }
  }

  function repeatLevel() {
    setCompleted(null)
    resetBoard()
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[520px] flex-col">
      {/* cabeçalho */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <Badge>{session.eco}</Badge>
        <span className="truncate text-[13px] font-semibold text-foreground">
          {session.name}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-2">
        <Badge variant="outline" className="border-primary/40 text-primary">
          Nível {levelNumber}
        </Badge>
        <span className="text-xs text-muted-foreground">
          lances 1–{trainUpTo} de {totalPlies}
        </span>
        <div className="ml-auto inline-flex overflow-hidden rounded-lg border">
          <button
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              opponent === 'book'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setOpponent('book')}
            title="O adversário responde com a teoria do livro"
          >
            Livro
          </button>
          <button
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              opponent === 'human'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setOpponent('human')}
            title="O adversário joga como um humano real da tua faixa de rating"
          >
            <Users className="mr-1 inline size-3" />
            Humano real
          </button>
        </div>
      </div>

      <p className="pb-2 text-center text-sm text-muted-foreground">
        {finished
          ? 'A guardar progresso...'
          : waitingUser && !demoing
            ? `Joga as ${userColor === 'white' ? 'brancas' : 'pretas'}:`
            : 'O adversário responde...'}
      </p>

      {/* tabuleiro */}
      <div ref={frameRef} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div style={{ width: boardSize, height: boardSize }} className="shrink-0">
          <motion.div
            animate={shake ? { x: [0, -7, 7, -5, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-lg shadow-md"
          >
            <Chessboard
              options={{
                id: `line-${session.book_id}`,
                position: demoFen ?? game.fen(),
                boardOrientation: userColor,
                onPieceDrop: handleMove,
                animationDurationInMs: 180,
                allowDragging: waitingUser && !busy && !demoing && !finished,
                allowDrawingArrows: false,
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* ações + dica */}
      <div className="flex min-h-[32px] items-center gap-2 pt-2">
        {!demoing && played.length === 0 && !finished && (
          <Button variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={startDemo}>
            <Eye className="size-3.5" /> Aprender: ver os lances primeiro
          </Button>
        )}
        {demoing && (
          <span className="text-xs text-muted-foreground">
            A mostrar a linha... depois é contigo!
          </span>
        )}
      </div>

      <div className="flex min-h-[56px] flex-col justify-center gap-2 pt-1">
        {feedback && (
          <motion.div
            key={`${feedback.text}-${played.length}-${mistakes}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-wrap items-center gap-2 rounded-xl p-3 text-sm ${
              feedback.kind === 'ok'
                ? 'bg-emerald-500/10 text-emerald-700'
                : feedback.kind === 'info'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-red-500/10 text-red-600'
            }`}
          >
            {feedback.kind === 'ko' ? (
              <XCircle className="size-4 shrink-0" />
            ) : feedback.kind === 'info' ? (
              <Cpu className="size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
            {feedback.kind === 'ko' && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto h-7 rounded-full text-xs"
                onClick={() => setFeedback(null)}
              >
                Tentar outro lance
              </Button>
            )}
          </motion.div>
        )}

        {tip && !feedback && (
          <div className="flex items-start gap-2 rounded-lg border-l-2 border-primary bg-primary/5 p-2.5 text-left text-xs text-foreground">
            <BookOpenCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>{tip}</span>
          </div>
        )}
      </div>

      {/* progresso da linha */}
      {opponent === 'book' ? (
        <div className="flex max-h-[60px] flex-wrap gap-1 overflow-hidden pt-2">
          {session.san_moves.map((san, i) => {
            const locked = i >= trainUpTo
            const isPlayed = i < played.length
            const isUserMove = (i % 2 === 0) === (userColor === 'white')
            return (
              <span
                key={`${san}-${i}`}
                className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[11px] ${
                  locked
                    ? 'border-dashed opacity-40'
                    : isPlayed
                      ? isUserMove
                        ? 'border-primary/40 bg-primary/10 font-semibold text-primary'
                        : 'bg-muted'
                      : 'opacity-55'
                }`}
              >
                {i % 2 === 0 && <b className="opacity-60">{i / 2 + 1}.</b>}
                {locked ? <Lock className="size-2.5" /> : san}
              </span>
            )
          })}
        </div>
      ) : (
        <div className="pt-2">
          <Badge variant="outline" className="gap-1.5">
            <Users className="size-3" />
            Modo humano — o adversário joga como a tua faixa de rating
          </Badge>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <span>
          {played.length} / {trainUpTo} neste nível
        </span>
        {mistakes > 0 && (
          <span className="font-semibold text-red-500">
            {mistakes} {mistakes === 1 ? 'erro' : 'erros'} — repete sem erros para avançar
          </span>
        )}
      </div>
    </div>
  )
}
