import {
  Bar,
  CartesianGrid,
  BarChart as RechartsBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatBarValue, formatPercent } from '@/charts/format'
import { ChartTooltip } from '@/charts/recharts/chart-tooltip'
import { AXIS_STYLE, CHART_MARGIN, GRID_STYLE, toRows } from '@/charts/recharts/shared'
import type { BarChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/** Series are keyed by position, since two series could share a name. */
const keyOf = (index: number) => `s${index}`

/**
 * Recharts renderer for category bar charts: grouped bars with the categories as axis labels.
 * Values are percentages. Recharts has a native category axis, so no stand-in times are needed.
 */
export function BarChart({ categories, series, axisSide }: BarChartProps) {
  const rows = toRows(categories, Object.fromEntries(series.map((s, j) => [keyOf(j), s.values])), 'category')

  return (
    <ResponsiveContainer width="100%" height="100%">
      {/* 30% of each category is gap, matching the Lightweight Charts groups' 70% fill. */}
      <RechartsBarChart data={rows} margin={CHART_MARGIN} barCategoryGap="30%" barGap={0}>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="category" {...AXIS_STYLE} interval={0} />
        <YAxis orientation={axisSide} {...AXIS_STYLE} tickFormatter={formatPercent} />
        <ReferenceLine y={0} stroke={CHART_THEME.zeroLine} />
        <Tooltip
          isAnimationActive={false}
          cursor={{ fill: CHART_THEME.grid }}
          content={(props) => <ChartTooltip {...props} formatValue={formatBarValue} />}
        />
        {series.map((s, j) => (
          <Bar key={keyOf(j)} dataKey={keyOf(j)} name={s.name} fill={s.color} isAnimationActive={false} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
