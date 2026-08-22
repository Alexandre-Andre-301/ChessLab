import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RatingPoint } from '../../types/api'

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' }).format(new Date(iso))

export const RatingChart = ({ points }: { points: RatingPoint[] }) => {
  const data = points.map((point) => ({
    date: formatDate(point.played_at),
    rating: point.player_rating,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--text)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
          minTickGap={48}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 11, fill: 'var(--text)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-h)',
            fontSize: 13,
          }}
          labelStyle={{ color: 'var(--text)' }}
        />
        <Line
          type="monotone"
          dataKey="rating"
          stroke="#b26bff"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          isAnimationActive
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
