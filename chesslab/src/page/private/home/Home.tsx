import { motion } from 'framer-motion'
import { Link, Navigate } from 'react-router-dom'
import { BookOpen, Percent, Swords, TrendingUp } from 'lucide-react'
import { useMe } from '../../../hooks/useMe'
import { useOpeningStats } from '../../../hooks/useOpeningStats'
import { useAuthStore } from '../../../store/authStore'
import type { OpeningStat } from '../../../types/api'
import { SyncButton } from '../../../components/ui/SyncButton'
import './Home.css'

const TOP_OPENINGS = 10

const pct = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0

const OpeningsTable = ({ stats }: { stats: OpeningStat[] }) => {
  const mostUsed = [...stats]
    .sort((a, b) => b.games_played - a.games_played)
    .slice(0, TOP_OPENINGS)

  return (
    <div className="table-scroll">
      <table className="openings-table">
        <thead>
          <tr>
            <th>Abertura</th>
            <th>Jogos</th>
            <th>Vitórias</th>
            <th>Empates</th>
            <th>Derrotas</th>
          </tr>
        </thead>
        <tbody>
          {mostUsed.map((stat) => (
            <tr key={`${stat.opening_eco}-${stat.opening_name}`}>
              <td className="openings-name">
                <span className="openings-eco">{stat.opening_eco}</span>
                {stat.opening_name}
              </td>
              <td>{stat.games_played}</td>
              <td className="win">{pct(stat.wins, stat.games_played)}%</td>
              <td className="draw">{pct(stat.draws, stat.games_played)}%</td>
              <td className="loss">{pct(stat.losses, stat.games_played)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const Home = () => {
  const user = useAuthStore((state) => state.user)
  const { isLoading } = useMe()
  const { data: stats, isLoading: statsLoading } = useOpeningStats()

  if (!isLoading && user && !user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  const totalGames = stats?.reduce((sum, stat) => sum + stat.games_played, 0) ?? 0
  const totalWins = stats?.reduce((sum, stat) => sum + stat.wins, 0) ?? 0
  const overallWinRate = pct(totalWins, totalGames)
  const distinctOpenings = stats?.length ?? 0
  const worstOpening =
    stats && stats.length > 0
      ? [...stats].sort((a, b) => a.win_rate - b.win_rate)[0]
      : null

  return (
    <div className="page">
      <h1 className="page-title">Olá, {user?.full_name.split(' ')[0]}</h1>
      <p className="page-subtitle">
        As tuas aberturas dos últimos jogos importados do Chess.com
        {user?.chesscom_username ? ` (${user.chesscom_username})` : ''}.
      </p>

      {statsLoading ? (
        <p>A carregar estatísticas...</p>
      ) : !stats || stats.length === 0 ? (
        <motion.div
          className="card empty-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Ainda não há partidas importadas</h2>
          <p className="muted">
            Sincroniza agora para analisarmos os teus últimos 3 meses de jogos.
          </p>
          <SyncButton />
        </motion.div>
      ) : (
        <>
          <div className="stat-grid">
            {[
              { icon: Swords, value: String(totalGames), label: 'Partidas analisadas' },
              { icon: Percent, value: `${overallWinRate}%`, label: 'Taxa de vitória' },
              { icon: BookOpen, value: String(distinctOpenings), label: 'Aberturas diferentes' },
            ].map(({ icon: Icon, value, label }, index) => (
              <motion.div
                key={label}
                className="card stat-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.07 }}
              >
                <Icon size={18} className="stat-accent" />
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </motion.div>
            ))}
            {worstOpening && (
              <motion.div
                className="card stat-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.21 }}
              >
                <TrendingUp size={18} className="stat-accent" />
                <div className="stat-value stat-worst">{worstOpening.win_rate}%</div>
                <div className="stat-label">
                  pior abertura:{' '}
                  <Link to="/treino-aberturas" className="stat-link">
                    treinar
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
          >
            <div className="openings-head">
              <h2 className="card-title">As tuas aberturas</h2>
              <SyncButton />
            </div>
            <p className="openings-total">
              {totalGames} partidas · {distinctOpenings} aberturas diferentes
              {distinctOpenings > TOP_OPENINGS
                ? ` · a mostrar as ${TOP_OPENINGS} mais usadas`
                : ''}
            </p>
            <OpeningsTable stats={stats} />
          </motion.div>
        </>
      )}
    </div>
  )
}
