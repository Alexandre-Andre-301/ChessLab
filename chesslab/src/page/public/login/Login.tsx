import { Link } from 'react-router-dom'
import { LoginForm } from '../../../components/forms/LoginForm'
import { GuestRoute } from '../../../components/routing/Guards'
import '../../../styles/auth.css'

export const Login = () => {
  return (
    <GuestRoute>
      <main className="auth-page">
        <div className="auth-card">
          {/* substitui este bloco pelo teu logótipo */}
          <div className="auth-logo" aria-hidden="true" />

          <h1>Entrar</h1>
          <p className="auth-subtitle">Bem-vindo de volta ao ChessLab.</p>

          <LoginForm />

          <p className="auth-switch">
            Ainda não tens conta? <Link to="/cadastro">Criar conta</Link>
          </p>
        </div>
      </main>
    </GuestRoute>
  )
}
