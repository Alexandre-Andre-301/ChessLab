import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { trainingService } from '../../../services/trainingService'
import { useAuthStore } from '../../../store/authStore'
import { useGenerateCards, useTrainingOverview } from '../../../hooks/useTraining'
import { TrainingSession } from '../../../components/training/TrainingSession'
import type { ReviewCardSummary } from '../../../types/api'
import '../../../styles/dashboard.css'

export const TreinoAberturas = () => {
  const token = useAuthStore((state) => state.token)
  const { data: overview, isLoading: overviewLoading } = useTrainingOverview()
  const generate = useGenerateCards()
  const [sessionCards, setSessionCards] = useState<ReviewCardSummary[] | null>(null)

  // refetch dos cartões quando a sessão acaba
  const { refetch, isFetching } = useQuery({
    queryKey: ['due-opening'],
    queryFn: () => trainingService.dueCards(token!, 'opening', 10),
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

  const dueOpening = overview?.opening.due ?? 0

  return (
    <div className="page">
      <h1 className="page-title">Treino de Aberturas</h1>
      <p className="page-subtitle">
        Repetição espaçada com o teu repertório real — extraído das tuas partidas.
      </p>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="training-overview">
          <div>
            <h2 className="card-title">Aberturas</h2>
            <p className="muted">
              {overviewLoading
                ? 'A carregar...'
                : overview?.opening.total
                  ? `${overview.opening.total} cartões · ${overview.opening.due} para rever hoje`
                  : 'Ainda não há cartões.'}
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={startSession}
            disabled={isFetching || dueOpening === 0}
          >
            {isFetching ? 'A preparar...' : dueOpening > 0 ? `Treinar (${dueOpening})` : 'Nada para rever'}
          </button>
        </div>

        <p className="muted training-note">
          Os cartões são posições das tuas próprias partidas. Acertas → voltam daqui
          a dias; falhas → voltam hoje.
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
              <Sparkles size={16} className="stat-accent" /> Gerar mais cartões
            </h2>
            <p className="muted settings-help">
              Reanalisa as partidas importadas e cria novos cartões (máx. 60 aberturas + 30 puzzles).
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
