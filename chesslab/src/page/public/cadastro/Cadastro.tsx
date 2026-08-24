import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { RegisterForm } from '../../../components/forms/RegisterForm'
import { GuestRoute } from '../../../components/routing/Guards'

export const Cadastro = () => {
  return (
    <GuestRoute>
      <main className="flex min-h-full flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-[400px] shadow-lg">
          <CardContent className="flex flex-col gap-6 p-8">
            {/* substitui este bloco pelo teu logótipo */}
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/10 text-2xl">
              ♟
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Criar conta</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Começa a analisar as tuas partidas de xadrez.
              </p>
            </div>

            <RegisterForm />

            <p className="text-center text-sm text-muted-foreground">
              Já tens conta?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </GuestRoute>
  )
}
