import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { LoginForm } from '../../../components/forms/LoginForm'
import { GuestRoute } from '../../../components/routing/Guards'

export const Login = () => {
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
              <h1 className="text-2xl font-bold text-foreground">Entrar</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bem-vindo de volta ao ChessLab.
              </p>
            </div>

            <LoginForm />

            <p className="text-center text-sm text-muted-foreground">
              Ainda não tens conta?{' '}
              <Link to="/cadastro" className="font-medium text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </GuestRoute>
  )
}
