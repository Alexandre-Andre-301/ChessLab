import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookMarked,
  ChevronDown,
  ChevronRight,
  Cpu,
  Sparkles,
  Swords,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { trainingService } from '../../../services/trainingService'
import { useAuthStore } from '../../../store/authStore'
import {
  useGenerateCards,
  useTrainingFamilies,
  useTrainingOverview,
} from '../../../hooks/useTraining'
import { useBookLines } from '../../../hooks/useBookLines'
import { TrainingSession } from '../../../components/training/TrainingSession'
import { GuidedLineSession } from '../../../components/training/GuidedLineSession'
import type {
  BrowseCard,
  CardStatus,
  LineSession,
  ReviewCardSummary,
  FamilyStat,
} from '../../../types/api'

function ColorSectionTitle({ color }: { color: 'white' | 'black' }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1.5 px-3 py-1">
        <span
          className={`inline-block size-2.5 rounded-full border ${
            color === 'white' ? 'bg-stone-100' : 'bg-zinc-800'
          }`}
        />
        {color === 'white' ? 'Com brancas' : 'Com pretas'}
      </Badge>
    </div>
  )
}

function FamilyCard({
  family,
  onStart,
  onGuided,
}: {
  family: FamilyStat
  onStart: () => void
  onGuided: () => void
}) {
  const [showTheory, setShowTheory] = useState(false)
  const { data: lines, isLoading: linesLoading } = useBookLines(
    showTheory ? family.family : null,
  )

  const masteryPct = Math.max(0, Math.min(100, family.mastery ?? 0))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <Card className="flex h-full flex-col gap-3 py-4">
        <CardContent className="flex flex-1 flex-col gap-3 px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-foreground">
                {family.family}
              </h3>
              <p className="text-xs text-muted-foreground">
                {family.eco ?? '—'} · {family.total} cartões ·{' '}
                {family.due > 0 ? `${family.due} para rever hoje` : 'em dia'}
              </p>
            </div>
            <Button size="sm" onClick={onStart} disabled={family.due === 0}>
              <Swords className="size-3.5" />
              {family.due > 0 ? `Treinar (${family.due})` : 'Em dia'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Progress value={masteryPct} className="h-1.5" />
            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              {masteryPct}% domínio
            </span>
          </div>

          <div className="flex flex-col items-start gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary"
              onClick={onGuided}
            >
              <Cpu className="size-3.5" /> Linha guiada (Stockfish)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary"
              onClick={() => setShowTheory((v) => !v)}
            >
              <BookMarked className="size-3.5" /> Teoria da base ECO
              <ChevronDown
                className={`size-3.5 transition-transform ${showTheory ? 'rotate-180' : ''}`}
              />
            </Button>
          </div>

          {showTheory && (
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
              {linesLoading ? (
                <p className="text-xs text-muted-foreground">A carregar linhas...</p>
              ) : !lines || lines.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Sem linhas na base para esta família.
                </p>
              ) : (
                lines.map((line) => (
                  <div key={`${line.eco}-${line.name}`} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {line.eco}
                      </Badge>
                      <span className="truncate text-xs font-semibold text-foreground">
                        {line.name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {line.san_line.join(' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

const STATUS_BADGE: Record<CardStatus, { label: string; cls: string }> = {
  learning: { label: 'a aprender', cls: 'bg-sky-500/10 text-sky-600 border-sky-500/30' },
  review: { label: 'em revisão', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  mastered: { label: 'dominado', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
}

function RepertoireRow({ card }: { card: BrowseCard }) {
  const [open, setOpen] = useState(false)
  const status = STATUS_BADGE[(card.status as CardStatus) ?? 'review']

  return (
    <div className="rounded-lg border">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
          {card.opening_eco ?? '—'}
        </Badge>
        <span className="font-mono text-[13px] font-semibold text-foreground">
          {card.correct_move}
        </span>
        {card.lapses > 0 && (
          <span className="text-[11px] text-red-500" title="erros acumulados">
            {card.lapses}x ✗
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{card.mastery}%</span>
          <Badge variant="outline" className={`text-[10px] ${status.cls}`}>
            {status.label}
          </Badge>
        </span>
      </button>

      {open && (
        <div className="border-t px-3 py-2.5 text-left">
          {card.line_moves.length > 0 && (
            <p className="font-mono text-[11.5px] text-muted-foreground">
              {card.line_moves.join(' ')}{' '}
              <span className="font-semibold text-primary">{card.correct_move}</span>
            </p>
          )}
          {card.explanation && (
            <p className="mt-1 text-xs text-muted-foreground">{card.explanation}</p>
          )}
          <p className="mt-1 text-[11px] opacity-60">
            {card.occurrences}x nos teus jogos · intervalo {card.interval_days}d ·{' '}
            {card.repetitions} revisões
          </p>
        </div>
      )}
    </div>
  )
}

function RepertoireView({ token }: { token: string }) {
  const { data: cards, isLoading } = useQuery({
    queryKey: ['browse-opening'],
    queryFn: () => trainingService.browse(token!, 'opening'),
    enabled: !!token,
  })

  if (isLoading) {
    return <p className="py-6 text-sm text-muted-foreground">A carregar repertório...</p>
  }
  if (!cards || cards.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Ainda não há cartões. Gera-os a partir das tuas partidas.
        </CardContent>
      </Card>
    )
  }

  const groups = new Map<string, BrowseCard[]>()
  for (const card of cards) {
    const key = `${card.family ?? 'Outras'}|${card.color ?? 'white'}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(card)
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([key, groupCards]) => {
        const [fam, color] = key.split('|')
        const avg = Math.round(
          groupCards.reduce((s, c) => s + (c.mastery ?? 0), 0) / groupCards.length,
        )
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <span
                  className={`inline-block size-2.5 rounded-full border ${
                    color === 'white' ? 'bg-stone-100' : 'bg-zinc-800'
                  }`}
                />
                {fam}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {groupCards.length} posições · {avg}% domínio
              </span>
            </div>
            <div className="space-y-1.5">
              {groupCards.map((c) => (
                <RepertoireRow key={c.id} card={c} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const TreinoAberturas = () => {
  const token = useAuthStore((state) => state.token)
  const { data: overview } = useTrainingOverview()
  const { data: families, isLoading: familiesLoading } = useTrainingFamilies()
  const generate = useGenerateCards()
  const [view, setView] = useState<'cursos' | 'repertorio'>('cursos')
  const [sessionCards, setSessionCards] = useState<ReviewCardSummary[] | null>(null)
  const [sessionFamily, setSessionFamily] = useState<string | undefined>(undefined)
  const [guidedSession, setGuidedSession] = useState<LineSession | null>(null)
  const [guidedError, setGuidedError] = useState<string | null>(null)

  const { refetch, isFetching } = useQuery({
    queryKey: ['due-opening'],
    queryFn: () => trainingService.dueCards(token!, 'opening', 50),
    enabled: !!token,
    staleTime: 0,
  })

  const startSession = async (family?: string, color?: 'white' | 'black') => {
    setSessionFamily(
      family ? `${family} · ${color === 'black' ? 'pretas' : 'brancas'}` : undefined,
    )
    const result = await refetch()
    let cards = result.data ?? []
    if (family) {
      cards = await trainingService.dueCards(token!, 'opening', 50, family, color)
    }
    if (cards.length > 0) setSessionCards(cards)
  }

  const startGuided = async (family: string, color: 'white' | 'black') => {
    setGuidedError(null)
    try {
      const session = await trainingService.lineSession(token!, family, color)
      setGuidedSession(session)
    } catch {
      setGuidedError('Não foi possível carregar a linha guiada.')
    }
  }

  if (guidedSession) {
    return (
      <div className="mx-auto h-full w-full max-w-[980px] px-4 py-4">
        <GuidedLineSession
          session={guidedSession}
          onFinish={() => {
            setGuidedSession(null)
            refetch()
          }}
        />
      </div>
    )
  }

  if (sessionCards) {
    return (
      <div className="mx-auto h-full w-full max-w-[980px] px-4 py-4">
        <TrainingSession
          key={sessionCards[0]?.id ?? 'empty'}
          streakDays={overview?.streak_days}
          familyName={sessionFamily}
          type="opening"
          cards={sessionCards}
          onFinish={() => {
            setSessionCards(null)
            refetch()
          }}
          onReviewWeak={(weak) => {
            setSessionFamily('Revisão de posições fracas')
            setSessionCards(weak)
          }}
        />
      </div>
    )
  }

  const totalDue = families?.reduce((sum, f) => sum + f.due, 0) ?? 0
  const whiteFamilies = families?.filter((f) => f.color !== 'black') ?? []
  const blackFamilies = families?.filter((f) => f.color === 'black') ?? []

  return (
    <div className="mx-auto flex h-full w-full max-w-[980px] flex-col gap-4 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex overflow-hidden rounded-lg border">
          <button
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'cursos'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setView('cursos')}
          >
            Cursos
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'repertorio'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setView('repertorio')}
          >
            Repertório
          </button>
        </div>
        <Button onClick={() => startSession()} disabled={isFetching || totalDue === 0}>
          {isFetching
            ? 'A preparar...'
            : totalDue > 0
              ? `Treinar tudo (${totalDue})`
              : 'Nada para rever'}
        </Button>
      </div>

      {guidedError && (
        <Card className="border-destructive/40">
          <CardContent className="p-3 text-sm text-destructive">{guidedError}</CardContent>
        </Card>
      )}

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-2">
        {view === 'repertorio' ? (
          <RepertoireView token={token!} />
        ) : familiesLoading ? (
          <p className="text-sm text-muted-foreground">A carregar cursos...</p>
        ) : !families || families.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Ainda não há cartões. Gera os primeiros a partir das tuas partidas abaixo.
            </CardContent>
          </Card>
        ) : (
          <>
            {whiteFamilies.length > 0 && (
              <>
                <ColorSectionTitle color="white" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {whiteFamilies.map((f) => (
                    <FamilyCard
                      key={`w-${f.family}`}
                      family={f}
                      onStart={() => startSession(f.family, 'white')}
                      onGuided={() => startGuided(f.family, 'white')}
                    />
                  ))}
                </div>
              </>
            )}

            {blackFamilies.length > 0 && (
              <>
                <ColorSectionTitle color="black" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {blackFamilies.map((f) => (
                    <FamilyCard
                      key={`b-${f.family}`}
                      family={f}
                      onStart={() => startSession(f.family, 'black')}
                      onGuided={() => startGuided(f.family, 'black')}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          <Sparkles className="size-3.5 text-primary" />
          {generate.isPending ? 'A analisar jogos...' : 'Gerar mais cartões'}
        </Button>
        {generate.isSuccess && (
          <span className="text-xs text-muted-foreground">
            +{generate.data.opening_cards} aberturas · +{generate.data.puzzle_cards} puzzles
          </span>
        )}
        {generate.isError && (
          <span className="text-xs text-destructive">{(generate.error as Error).message}</span>
        )}
      </div>
    </div>
  )
}
