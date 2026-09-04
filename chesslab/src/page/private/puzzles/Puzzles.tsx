import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Flame, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { trainingService } from '../../../services/trainingService'
import { useAuthStore } from '../../../store/authStore'
import { useGenerateCards, useTrainingOverview } from '../../../hooks/useTraining'
import { TrainingSession } from '../../../components/training/TrainingSession'
import type { ReviewCardSummary } from '../../../types/api'

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
      <div className="mx-auto h-full w-full max-w-[980px] px-4 py-4">
        <TrainingSession
          key={sessionCards[0]?.id ?? 'empty'}
          streakDays={overview?.streak_days}
          familyName="Puzzles"
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
    <div className="mx-auto flex h-full w-full max-w-[720px] flex-col gap-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Puzzles</h1>
          <p className="text-sm text-muted-foreground">
            Táticas reais das tuas partidas — mate em 1 e capturas vencedoras.
          </p>
        </div>
        <Button onClick={startSession} disabled={isFetching || duePuzzles === 0}>
          {isFetching ? (
            'A preparar...'
          ) : duePuzzles > 0 ? (
            <>
              <Flame className="size-4" /> Resolver ({duePuzzles})
            </>
          ) : (
            'Nada para hoje'
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Puzzles disponíveis</h2>
              <p className="text-sm text-muted-foreground">
                {overviewLoading
                  ? 'A carregar...'
                  : overview?.puzzle.total
                    ? `${overview.puzzle.total} puzzles no baralho`
                    : 'Ainda não há puzzles.'}
              </p>
            </div>
            {overview?.puzzle.due ? (
              <Badge className="gap-1">
                <Flame className="size-3" /> {overview.puzzle.due} para hoje
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Falhaste? O puzzle volta mais cedo (SM-2). Acertas seguidas? some por uns dias.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Sparkles className="size-4 text-primary" /> Gerar puzzles dos teus jogos
              </h2>
              <p className="text-xs text-muted-foreground">
                Procuramos mate em 1 e capturas que ganham material nas tuas partidas.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              {generate.isPending ? 'A analisar...' : 'Gerar'}
            </Button>
          </div>

          {generate.isSuccess && (
            <p className="text-xs text-muted-foreground">
              Criados {generate.data.opening_cards} de aberturas e{' '}
              {generate.data.puzzle_cards} de puzzles.
            </p>
          )}
          {generate.isError && (
            <p className="text-xs text-destructive">{(generate.error as Error).message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
