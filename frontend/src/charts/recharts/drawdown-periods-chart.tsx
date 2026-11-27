import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartTooltip } from '@/charts/recharts/chart-tooltip'
import {
  AXIS_STYLE,
  CHART_MARGIN,
  dateTickFormatter,
  formatFullDate,
  formatLevel,
  GRID_STYLE,
  toRows,
} from '@/charts/recharts/shared'
import type { DrawdownPeriodsChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/** Recharts renderer for the Drawdown Periods Chart: both Levels with shaded Periods. */
export function DrawdownPeriodsChart({ dates, benchmark, strategy, periods, axisSide }: DrawdownPeriodsChartProps) {
  const rows = toRows(dates, { benchmark, strategy })
  const formatDate = dateTickFormatter(dates)
  // The x axis is categorical, so a band can only start and end on a date in the data; a Period
  // whose dates aren't in this Window (mid-refresh) is left out rather than drawn in the wrong place.
  const onChart = new Set(dates)
  const shown = periods.filter((p) => onChart.has(p.start) && onChart.has(p.end))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={CHART_MARGIN}>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey="date" {...AXIS_STYLE} tickFormatter={formatDate} minTickGap={48} />
        <YAxis orientation={axisSide} {...AXIS_STYLE} domain={['auto', 'auto']} tickFormatter={formatLevel} />
        <Tooltip
          isAnimationActive={false}
          content={(props) => (
            <ChartTooltip {...props} formatLabel={formatFullDate} formatValue={(v) => formatLevel(v)} />
          )}
        />
        {/* Full-height bands (no y1/y2), drawn before the lines so they sit behind them. */}
        {shown.map((p) => (
          <ReferenceArea
            key={`${p.start}/${p.end}`}
            x1={p.start}
            x2={p.end}
            fill={CHART_THEME.periodBand}
            fillOpacity={1}
            stroke="none"
          />
        ))}
        <Line
          dataKey="benchmark"
          name="Benchmark"
          type="linear"
          stroke={CHART_THEME.benchmark}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="strategy"
          name="Strategy"
          type="linear"
          stroke={CHART_THEME.strategy}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
