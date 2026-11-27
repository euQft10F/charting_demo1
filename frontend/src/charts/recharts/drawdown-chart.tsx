import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { FLAT_DRAWDOWN_RANGE, hasDrawdown } from '@/charts/drawdown-axis'
import { formatFullDate, formatPercent } from '@/charts/format'
import { ChartTooltip } from '@/charts/recharts/chart-tooltip'
import {
  AXIS_STYLE,
  CHART_MARGIN,
  dateTickFormatter,
  GRID_STYLE,
  toRows,
} from '@/charts/recharts/shared'
import type { DrawdownChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/**
 * Drawdowns are never above 0, so the axis tops out at 0. 'auto' keeps Recharts' round ticks (a
 * function bound would turn them off). A flat Window takes FLAT_DRAWDOWN_RANGE instead.
 */
const DRAWDOWN_DOMAIN: [number | 'auto', number] = ['auto', 0]
/** Recharts renderer for the Drawdown Chart: both Drawdowns, overlaid, hanging from 0. */
export function DrawdownChart({ dates, benchmark, strategy, axisSide }: DrawdownChartProps) {
  const rows = toRows(dates, { benchmark, strategy })
  const formatDate = dateTickFormatter(dates)
  const flat = !hasDrawdown(benchmark, strategy)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={CHART_MARGIN}>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="date" {...AXIS_STYLE} tickFormatter={formatDate} minTickGap={48} />
        <YAxis orientation={axisSide} {...AXIS_STYLE} domain={flat ? FLAT_DRAWDOWN_RANGE : DRAWDOWN_DOMAIN} tickFormatter={formatPercent} />
        <Tooltip
          isAnimationActive={false}
          content={(props) => (
            <ChartTooltip {...props} formatLabel={formatFullDate} formatValue={formatPercent} />
          )}
        />
        {/* The Benchmark is drawn first, so the Strategy overlays it. A missing Index draws nothing. */}
        {benchmark && (
          <Area
            dataKey="benchmark"
            name="Benchmark"
            type="linear"
            baseValue={0}
            stroke={CHART_THEME.benchmark}
            strokeWidth={2}
            fill={CHART_THEME.benchmarkFill}
            fillOpacity={1}
            isAnimationActive={false}
          />
        )}
        {strategy && (
          <Area
            dataKey="strategy"
            name="Strategy"
            type="linear"
            baseValue={0}
            stroke={CHART_THEME.strategy}
            strokeWidth={2}
            fill={CHART_THEME.strategyFill}
            fillOpacity={1}
            isAnimationActive={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
