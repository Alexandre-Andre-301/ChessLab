import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Flame, Sparkles } from 'lucide-react'
import { trainingService } from '../../../services/trainingService'
import { useAuthStore } from '../../../store/authStore'
import { useGenerateCards, useTrainingOverview } from '../../../hooks/useTraining'
import { TrainingSession } from '../../../components/training/TrainingSession'
import type { ReviewCardSummary } from '../../../types/api'
import '../../../styles/dashboard.css'

export const Puzzles = () => {
  const token = useAuthStore((state) => state.token)
  const { data: overview, isLoading: overviewLoading } = useTrainingOverview()
  const generate = useGenerateCards()
  const [sessionCards, setSessionCards] = useState<ReviewCardSummary[] | null>(null)

  const { refetch, isFetching } = useQuery({
    queryKey: ['due-puzzle'],
    queryFn: () => trainingService.dueCards(token!, 'puzzle', 10),
    enabled: !!token,
    staleTime: 0,
  })

  const startSession = async () => {
    const result = await refetch()
    if (result.data && result.data.length > 0) {
      setSessionCards(result.data)
    }
  }

  if (sessionCards) {
    return (
      <div className="page">
        <TrainingSession
          key={sessionCards[0]?.id ?? 'empty'}
          type="puzzle"
          cards={sessionCards}
          onFinish={() => {
            setSessionCards(null)
            refetch()
          }}
        />
      </div>
    )
  }

  const duePuzzles = overview?.puzzle.due ?? 0

  return (
    <div className="page">
      <h1 className="page-title">Puzzles</h1>
      <p className="page-subtitle">
        Posições reais das tuas partidas — mates e capturas vencedoras que aí estavam.
      </p>

      <motion.div
        className="card puzzles-hero-mini"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="training-overview">
          <div>
            <h2 className="card-title">Puzzles disponíveis</h2>
            <p className="muted">
              {overviewLoading
                ? 'A carregar...'
                : overview?.puzzle.total
                  ? `${overview.puzzle.total} cartões · ${overview.puzzle.due} para resolver hoje`
                  : 'Ainda não há puzzles.'}
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={startSession}
            disabled={isFetching || duePuzzles === 0}
          >
            {isFetching ? (
              'A preparar...'
            ) : duePuzzles > 0 ? (
              <>
                <Flame size={16} /> Resolver ({duePuzzles})
              </>
            ) : (
              'Nada para hoje'
            )}
          </button>
        </div>

        <p className="muted settings-help">
          Falhaste uma vez? O puzzle volta mais cedo (SM-2). Acertas seguidas? some
          por uns dias.
        </p>
      </motion.div>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
      >
        <div className="training-overview">
          <div>
            <h2 className="card-title">
              <Sparkles size={16} className="stat-accent" /> Gerar puzzles dos teus jogos
            </h2>
            <p className="muted settings-help">
              Procuramos mate em 1 e capturas que ganham material nas tuas partidas.
            </p>
          </div>

          <button
            className="btn-secondary"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            {generate.isPending ? 'A analisar...' : 'Gerar'}
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
