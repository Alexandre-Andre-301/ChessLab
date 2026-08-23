import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link, Navigate } from 'react-router-dom'
import { AlertTriangle, BookOpen, Percent, Swords, TrendingDown, TrendingUp } from 'lucide-react'
import { useMe } from '../../../hooks/useMe'
import { useOpeningStats } from '../../../hooks/useOpeningStats'
import { useRatingHistory } from '../../../hooks/useRatingHistory'
import { useGames, useInsights, usePerformance } from '../../../hooks/useGameData'
import { useAuthStore } from '../../../store/authStore'
import type { OpeningStat, TimeClassStat } from '../../../types/api'
import { SyncButton } from '../../../components/ui/SyncButton'
import './Home.css'

const TOP_OPENINGS = 10

const pct = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0

const TIME_CLASS_LABEL: Record<string, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rápido',
  daily: 'Daily',
}

function ratingDelta30d(points: { player_rating: number; played_at: string }[]): number {
  if (points.length < 2) return 0
  const last = points[points.length - 1]
  const limit = new Date(last.played_at).getTime() - 30 * 24 * 60 * 60 * 1000
  let reference = points[0]
  for (const point of points) {
    if (new Date(point.played_at).getTime() <= limit) reference = point
    else break
  }
  return last.player_rating - reference.player_rating
}

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
  const { data: history } = useRatingHistory()
  const { data: performance } = usePerformance()
  const { data: insights } = useInsights()
  const { data: recentGames } = useGames({}, 5, 0)

  const delta = useMemo(() => ratingDelta30d(history ?? []), [history])

  if (!isLoading && user && !user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  const currentRating = history?.length ? history[history.length - 1].player_rating : null
  const worstInsight = insights?.find((i) => i.kind === 'weakness')
  const topOpenings = stats?.length ?? 0

  return (
    <div className="page">
      <h1 className="page-title">Olá, {user?.full_name.split(' ')[0]}</h1>

      <div className="dash-grid">
        {/* Rating atual */}
        <motion.div
          className="card stat-card dash-rating"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <span className="stat-label">Rating atual</span>
          <div className="stat-value">
            {currentRating ?? user?.peak_rating ?? '—'}
          </div>
          {delta !== 0 && (
            <span className={`dash-delta ${delta > 0 ? 'up' : 'down'}`}>
              {delta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {delta > 0 ? '+' : ''}{delta} nos últimos 30 dias
            </span>
          )}
        </motion.div>

        {/* Performance por ritmo */}
        <motion.div
          className="card dash-perf"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06 }}
        >
          <span className="stat-label">Performance por ritmo</span>
          <div className="perf-row">
            {(performance ?? []).map((p: TimeClassStat) => (
              <div key={p.time_class} className="perf-item">
                <span className="perf-rate">{p.win_rate}%</span>
                <span className="perf-class">
                  {TIME_CLASS_LABEL[p.time_class] ?? p.time_class} ({p.games})
                </span>
              </div>
            ))}
            {!performance?.length && <span className="muted">Sem dados ainda.</span>}
          </div>
        </motion.div>
      </div>

      {/* Maior problema — o coração do dashboard segundo a spec §36 */}
      {worstInsight && (
        <motion.div
          className="card problem-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.12 }}
        >
          <div className="problem-head">
            <AlertTriangle size={18} />
            <span>O teu maior problema agora</span>
          </div>
          <h2>{worstInsight.title}</h2>
          <p className="muted">{worstInsight.message}</p>
          <Link to="/insights" className="btn-secondary problem-link">
            Ver análise completa
          </Link>
        </motion.div>
      )}

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
              { icon: Swords, value: String(stats.reduce((s, o) => s + o.games_played, 0)), label: 'Partidas analisadas' },
              {
                icon: Percent,
                value: `${pct(stats.reduce((s, o) => s + o.wins, 0), stats.reduce((s, o) => s + o.games_played, 0))}%`,
                label: 'Taxa de vitória',
              },
              { icon: BookOpen, value: String(topOpenings), label: 'Aberturas diferentes' },
            ].map(({ icon: Icon, value, label }, index) => (
              <motion.div
                key={label}
                className="card stat-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.15 + index * 0.06 }}
              >
                <Icon size={18} className="stat-accent" />
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2 }}
          >
            <div className="openings-head">
              <h2 className="card-title">As tuas aberturas</h2>
              <SyncButton />
            </div>
            <p className="openings-total">
              {stats.reduce((s, o) => s + o.games_played, 0)} partidas · {topOpenings} aberturas
              {topOpenings > TOP_OPENINGS ? ` · a mostrar as ${TOP_OPENINGS} mais usadas` : ''}
            </p>
            <OpeningsTable stats={stats} />
          </motion.div>
        </>
      )}

      {/* Partidas recentes */}
      {recentGames && recentGames.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.25 }}
        >
          <div className="openings-head">
            <h2 className="card-title">Partidas recentes</h2>
            <Link to="/partidas" className="see-all">Ver todas →</Link>
          </div>
          <div className="recent-list">
            {recentGames.map((g) => (
              <Link key={g.id} to={`/partidas/${g.id}`} className={`recent-row ${g.result}`}>
                <span className={`game-result-badge ${g.result}`}>
                  {g.result === 'win' ? 'V' : g.result === 'loss' ? 'D' : 'E'}
                </span>
                <span className="recent-opponent">vs {g.opponent_username ?? '—'}</span>
                <span className="recent-meta">
                  {TIME_CLASS_LABEL[g.time_class ?? ''] ?? g.time_class} ·{' '}
                  {g.player_rating ?? '?'} vs {g.opponent_rating ?? '?'}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
