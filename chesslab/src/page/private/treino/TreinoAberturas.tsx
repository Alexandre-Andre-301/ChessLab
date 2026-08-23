import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookMarked, ChevronDown, Cpu, Sparkles, Swords } from 'lucide-react'
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
import type { LineSession, ReviewCardSummary } from '../../../types/api'
import '../../../styles/dashboard.css'

const FamilyCard = ({
  family,
  onStart,
  onGuided,
}: {
  family: { family: string; eco: string | null; total: number; due: number }
  onStart: () => void
  onGuided: () => void
}) => {
  const [showTheory, setShowTheory] = useState(false)
  const { data: lines, isLoading: linesLoading } = useBookLines(
    showTheory ? family.family : null,
  )

  const pctDone = family.total > 0
    ? Math.round(((family.total - family.due) / family.total) * 100)
    : 0

  return (
    <motion.div
      className="card family-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="family-head">
        <div>
          <h3 className="family-name">{family.family}</h3>
          <span className="family-meta">
            {family.eco ?? '—'} · {family.total} cartões ·{' '}
            {family.due > 0 ? `${family.due} para rever hoje` : 'em dia'}
          </span>
        </div>
        <button
          className="btn-primary family-train"
          onClick={onStart}
          disabled={family.due === 0}
        >
          <Swords size={15} />
          {family.due > 0 ? `Treinar (${family.due})` : 'Em dia'}
        </button>
      </div>

      <div className="bar-track">
        <motion.div
          className="bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pctDone}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="family-actions">
        <button className="theory-toggle" onClick={onGuided}>
          <Cpu size={14} />
          Linha guiada (Stockfish)
        </button>
        <button className="theory-toggle" onClick={() => setShowTheory((v) => !v)}>
          <BookMarked size={14} />
          Teoria da base ECO
          <ChevronDown size={14} className={showTheory ? 'rotated' : undefined} />
        </button>
      </div>

      {showTheory && (
        <div className="theory-panel">
          {linesLoading ? (
            <p className="muted">A carregar linhas...</p>
          ) : !lines || lines.length === 0 ? (
            <p className="muted">Sem linhas na base para esta família.</p>
          ) : (
            lines.map((line) => (
              <div key={`${line.eco}-${line.name}`} className="theory-line">
                <span className="openings-eco">{line.eco}</span>
                <span className="theory-name">{line.name}</span>
                <span className="theory-moves">{line.san_line.join(' ')}</span>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  )
}

export const TreinoAberturas = () => {
  const token = useAuthStore((state) => state.token)
  const { data: overview } = useTrainingOverview()
  const { data: families, isLoading: familiesLoading } = useTrainingFamilies()
  const generate = useGenerateCards()
  const [sessionCards, setSessionCards] = useState<ReviewCardSummary[] | null>(null)
  const [sessionFamily, setSessionFamily] = useState<string | undefined>(undefined)
  const [guidedSession, setGuidedSession] = useState<LineSession | null>(null)
  const [guidedError, setGuidedError] = useState<string | null>(null)
  const [guidedFamily, setGuidedFamily] = useState<string | null>(null)

  const { refetch, isFetching } = useQuery({
    queryKey: ['due-opening'],
    queryFn: () => trainingService.dueCards(token!, 'opening', 50),
    enabled: !!token,
    staleTime: 0,
  })

  const startSession = async (family?: string) => {
    setSessionFamily(family)
    const result = await refetch()
    let cards = result.data ?? []
    if (family) {
      const filtered = await trainingService.dueCards(token!, 'opening', 50, family)
      cards = filtered
    }
    if (cards.length > 0) {
      setSessionCards(cards)
    }
  }

  const startGuided = async (family: string) => {
    setGuidedError(null)
    setGuidedFamily(family)
    try {
      const session = await trainingService.lineSession(token!, family, 'white')
      setGuidedSession(session)
    } catch {
      setGuidedError('Não foi possível carregar a linha guiada.')
    }
  }

  if (guidedSession) {
    return (
      <div className="page">
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
      <div className="page">
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
        />
      </div>
    )
  }

  const totalDue = families?.reduce((sum, f) => sum + f.due, 0) ?? 0

  return (
    <div className="page">
      <div className="openings-head">
        <div>
          <h1 className="page-title">Treino de Aberturas</h1>
          <p className="page-subtitle">
            Um curso por abertura — flashcards + linha guiada com o Stockfish.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => startSession()}
          disabled={isFetching || totalDue === 0}
        >
          {isFetching
            ? 'A preparar...'
            : totalDue > 0
              ? `Treinar tudo (${totalDue})`
              : 'Nada para rever'}
        </button>
      </div>

      {guidedError && guidedFamily && (
        <div className="card">
          <p className="sync-status error">{guidedError}</p>
          <p className="muted">A família era: {guidedFamily}</p>
        </div>
      )}

      {familiesLoading ? (
        <p>A carregar cursos...</p>
      ) : !families || families.length === 0 ? (
        <div className="card">
          <p className="muted">
            Ainda não há cartões. Gera os primeiros a partir das tuas partidas abaixo.
          </p>
        </div>
      ) : (
        <div className="family-grid">
          {families.map((f) => (
            <FamilyCard
              key={f.family}
              family={f}
              onStart={() => startSession(f.family)}
              onGuided={() => startGuided(f.family)}
            />
          ))}
        </div>
      )}

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
      >
        <div className="training-overview">
          <div>
            <h2 className="card-title">
              <Sparkles size={16} className="stat-accent" /> Gerar mais cartões
            </h2>
            <p className="muted settings-help">
              Reanalisa as partidas importadas e cria novos cartões e famílias.
            </p>
          </div>

          <button
            className="btn-secondary"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            {generate.isPending ? 'A analisar jogos...' : 'Gerar cartões'}
          </button>
        </div>

        {generate.isSuccess && (
          <p className="sync-status">
            Criados {generate.data.opening_cards} de aberturas e{' '}
            {generate.data.puzzle_cards} de puzzles.
          </p>
        )}
        {generate.isError && (
          <p className="sync-status error">{(generate.error as Error).message}</p>
        )}
      </motion.div>
    </div>
  )
}
