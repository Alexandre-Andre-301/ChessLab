import { motion } from 'framer-motion'
import { AlertTriangle, Search, Target, TrendingUp } from 'lucide-react'
import { useInsights } from '../../../hooks/useGameData'
import type { InsightItem } from '../../../types/api'
import '../../../styles/dashboard.css'

const KIND_CONFIG = {
  weakness: { icon: AlertTriangle, label: 'Ponto fraco', cls: 'insight-weakness' },
  strength: { icon: Target, label: 'Ponto forte', cls: 'insight-strength' },
  trend: { icon: TrendingUp, label: 'Tendência', cls: 'insight-trend' },
  pattern: { icon: Search, label: 'Padrão detetado', cls: 'insight-pattern' },
} satisfies Record<InsightItem['kind'], unknown>

export const Insights = () => {
  const { data: insights, isLoading } = useInsights()

  return (
    <div className="page">
      <h1 className="page-title">Os teus Insights</h1>
      <p className="page-subtitle">
        Padrões reais extraídos das tuas partidas — não são estatísticas soltas.
      </p>

      {isLoading ? (
        <p>A analisar partidas...</p>
      ) : !insights || insights.length === 0 ? (
        <div className="card">
          <p className="muted">
            Ainda não há dados suficientes. Sincroniza mais partidas nas Configurações
            para gerar insights.
          </p>
        </div>
      ) : (
        insights.map((insight, index) => {
          const config = KIND_CONFIG[insight.kind]
          const Icon = config.icon
          return (
            <motion.div
              key={insight.title}
              className={`card insight-card ${config.cls}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.07 }}
            >
              <div className="insight-head">
                <Icon size={18} />
                <span className="insight-kind">{config.label}</span>
              </div>
              <h2 className="insight-title">{insight.title}</h2>
              <p className="muted">{insight.message}</p>
            </motion.div>
          )
        })
      )}
    </div>
  )
}
