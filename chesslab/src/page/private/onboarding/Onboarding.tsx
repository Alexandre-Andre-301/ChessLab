import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { onboardingSchema, type OnboardingFormData } from '../../../schemas/onboardingSchema'
import { useSaveOnboarding } from '../../../hooks/useSaveOnboarding'

const GOALS = [
  { value: 'aberturas', label: 'Melhorar aberturas' },
  { value: 'taticas', label: 'Treinar tática' },
  { value: 'finais', label: 'Dominar finais' },
  { value: 'estrategia', label: 'Jogar melhor em geral' },
]

export const Onboarding = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  })

  const mutation = useSaveOnboarding()

  const onSubmit = (data: OnboardingFormData) => {
    mutation.mutate(data)
  }

  const inputClass = 'h-10 bg-card'

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-[420px] shadow-lg">
        <CardContent className="flex flex-col gap-6 p-8">
          {/* substitui este bloco pelo teu logótipo */}
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/10 text-2xl">
            ♟
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Bem-vindo ao ChessLab</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Responde a estas perguntas para personalizar a tua experiência.
            </p>
          </div>

          <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="chesscom_username">Username do Chess.com</Label>
              <Input
                id="chesscom_username"
                type="text"
                className={inputClass}
                placeholder="ex.: hikaru"
                {...register('chesscom_username')}
              />
              {errors.chesscom_username ? (
                <p className="text-[13px] text-destructive">
                  {errors.chesscom_username.message}
                </p>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  Vamos verificar que esta conta existe no Chess.com.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="main_goal">O que queres melhorar? (opcional)</Label>
              <select
                id="main_goal"
                className={`${inputClass} rounded-lg border px-3`}
                {...register('main_goal')}
              >
                <option value="">— Opcional —</option>
                {GOALS.map((goal) => (
                  <option key={goal.value} value={goal.value}>
                    {goal.label}
                  </option>
                ))}
              </select>
              {errors.main_goal && (
                <p className="text-[13px] text-destructive">{errors.main_goal.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="peak_rating">Maior rating atual (opcional)</Label>
              <Input
                id="peak_rating"
                type="number"
                min={0}
                max={4000}
                className={inputClass}
                placeholder="ex.: 1500"
                {...register('peak_rating')}
              />
              {errors.peak_rating && (
                <p className="text-[13px] text-destructive">{errors.peak_rating.message}</p>
              )}
            </div>

            {mutation.isError && (
              <p className="text-[13px] text-destructive">{(mutation.error as Error).message}</p>
            )}

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A guardar e importar jogos...' : 'Concluir'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
