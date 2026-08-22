import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { onboardingSchema, type OnboardingFormData } from '../../../schemas/onboardingSchema'
import { useSaveOnboarding } from '../../../hooks/useSaveOnboarding'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

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

  return (
    <main className="auth-page">
      <div className="auth-card">
        {/* substitui este bloco pelo teu logótipo */}
        <div className="auth-logo" aria-hidden="true" />

        <h1>Bem-vindo ao ChessLab</h1>
        <p className="auth-subtitle">Responde a estas perguntas para personalizar a tua experiência.</p>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-field">
            <label htmlFor="chesscom_username">Username do Chess.com</label>
            <Input
              id="chesscom_username"
              type="text"
              placeholder="ex.: hikaru"
              {...register('chesscom_username')}
            />
            {errors.chesscom_username ? (
              <p className="form-error">{errors.chesscom_username.message}</p>
            ) : (
              <p className="form-hint">Vamos verificar que esta conta existe no Chess.com.</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="main_goal">O que queres melhorar? (opcional)</label>
            <select id="main_goal" className="form-select" {...register('main_goal')}>
              <option value="">— Opcional —</option>
              {GOALS.map((goal) => (
                <option key={goal.value} value={goal.value}>
                  {goal.label}
                </option>
              ))}
            </select>
            {errors.main_goal && <p className="form-error">{errors.main_goal.message}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="peak_rating">Maior rating atual (opcional)</label>
            <Input
              id="peak_rating"
              type="number"
              placeholder="ex.: 1500"
              min={0}
              max={4000}
              {...register('peak_rating')}
            />
            {errors.peak_rating && <p className="form-error">{errors.peak_rating.message}</p>}
          </div>

          {mutation.isError && (
            <p className="form-error">{(mutation.error as Error).message}</p>
          )}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'A guardar e importar jogos...' : 'Concluir'}
          </Button>
        </form>
      </div>
    </main>
  )
}
