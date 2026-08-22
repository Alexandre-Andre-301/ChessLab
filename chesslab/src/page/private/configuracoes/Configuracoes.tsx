import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { SyncButton } from '../../../components/ui/SyncButton'
import '../../../styles/dashboard.css'

export const Configuracoes = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="page">
      <h1 className="page-title">Configurações</h1>
      <p className="page-subtitle">Conta, dados e sessão.</p>

      <div className="card">
        <h2 className="card-title">Conta</h2>
        <div className="settings-rows">
          <div className="settings-row">
            <span className="settings-label">Nome</span>
            <span>{user.full_name}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">Chess.com</span>
            <span className="chip">{user.chesscom_username ?? 'não ligado'}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Dados do Chess.com</h2>
        <p className="muted settings-help">
          Importa as partidas dos últimos 3 meses. As partidas já importadas não
          são duplicadas.
        </p>
        <SyncButton />
      </div>

      <div className="card">
        <h2 className="card-title">Sessão</h2>
        <button className="btn-secondary btn-danger" onClick={handleLogout}>
          <LogOut size={16} />
          Terminar sessão
        </button>
      </div>
    </div>
  )
}
