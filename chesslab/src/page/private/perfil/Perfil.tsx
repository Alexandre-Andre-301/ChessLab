import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { useRatingHistory } from '../../../hooks/useRatingHistory'
import { RatingChart } from '../../../components/charts/RatingChart'
import '../../../styles/dashboard.css'

const TIME_CLASSES = [
  { value: undefined, label: 'Todas' },
  { value: 'blitz', label: 'Blitz' },
  { value: 'rapid', label: 'Rápido' },
  { value: 'bullet', label: 'Bullet' },
]

export const Perfil = () => {
  const user = useAuthStore((state) => state.user)
  const [timeClass, setTimeClass] = useState<string | undefined>(undefined)
  const { data: history, isLoading } = useRatingHistory(timeClass)

  if (!user) return null

  const memberSince = new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(user.created_at))

  const lastPoint = history && history.length > 0 ? history[history.length - 1] : null

  return (
    <div className="page">
      <h1 className="page-title">Perfil</h1>
      <p className="page-subtitle">A tua evolução no xadrez.</p>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="profile-header">
          <span className="profile-avatar">{user.full_name.charAt(0).toUpperCase()}</span>
          <div>
            <h2 className="profile-name">{user.full_name}</h2>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        <div className="profile-chips">
          <span className="chip">Chess.com: {user.chesscom_username ?? '—'}</span>
          {user.peak_rating != null && (
            <span className="chip">Maior rating: {user.peak_rating}</span>
          )}
          {lastPoint && (
            <span className="chip">
              <TrendingUp size={13} /> Rating atual: {lastPoint.player_rating}
            </span>
          )}
          <span className="chip">Membro desde {memberSince}</span>
        </div>
      </motion.div>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
      >
        <div className="chart-head">
          <h2 className="card-title">Evolução do rating</h2>
          <div className="filter-group">
            {TIME_CLASSES.map(({ value, label }) => (
              <button
                key={label}
                className={`filter-btn${timeClass === value ? ' active' : ''}`}
                onClick={() => setTimeClass(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p>A carregar gráfico...</p>
        ) : !history || history.length < 2 ? (
          <p className="muted">
            Ainda não há dados suficientes para desenhar a curva. Sincroniza as tuas
            partidas nas Configurações.
          </p>
        ) : (
          <RatingChart points={history} />
        )}
      </motion.div>
    </div>
  )
}
