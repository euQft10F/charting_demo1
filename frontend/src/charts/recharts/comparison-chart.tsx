import { useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartTooltip } from '@/charts/recharts/chart-tooltip'
import {
  AXIS_STYLE,
  CHART_MARGIN,
  dateTickFormatter,
  formatFullDate,
  formatLevel,
  formatPercent,
  GRID_STYLE,
  toRows,
} from '@/charts/recharts/shared'
import type { ComparisonChartProps } from '@/charts/types'
import { oppositeSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'

const differenceLast = (item: { dataKey?: unknown }) => (item.dataKey === 'difference' ? 1 : 0)

/** Recharts renderer for the Comparison Chart: Levels plus the Cumulative Difference on the other axis. */
export function ComparisonChart({ dates, benchmark, strategy, difference, logScale, axisSide }: ComparisonChartProps) {
  const rows = useMemo(() => toRows(dates, { benchmark, strategy, difference }), [dates, benchmark, strategy, difference])
  const formatDate = useMemo(() => dateTickFormatter(dates), [dates])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={rows} margin={CHART_MARGIN}>
        <CartesianGrid {...GRID_STYLE} yAxisId="level" />
        <XAxis dataKey="date" {...AXIS_STYLE} tickFormatter={formatDate} minTickGap={48} />
        <YAxis
          yAxisId="level"
          orientation={axisSide}
          {...AXIS_STYLE}
          // 'auto' rounds the bounds outward, which on a log scale could reach 0; the data's own
          // bounds can't, since Levels are always positive.
          scale={logScale ? 'log' : 'linear'}
          domain={logScale ? ['dataMin', 'dataMax'] : ['auto', 'auto']}
          tickFormatter={formatLevel}
        />
        <YAxis
          yAxisId="difference"
          orientation={oppositeSide(axisSide)}
          {...AXIS_STYLE}
          domain={['auto', 'auto']}
          tickFormatter={formatPercent}
        />
        <Tooltip
          isAnimationActive={false}
          content={(props) => (
            <ChartTooltip
              {...props}
              // The Area is drawn first so it sits behind the lines, but the tooltip lists it last.
              // (Recharts' `itemSorter` doesn't reach custom tooltip content.)
              payload={props.payload && [...props.payload].sort((a, b) => differenceLast(a) - differenceLast(b))}
              formatLabel={formatFullDate}
              formatValue={(v, key) => (key === 'difference' ? formatPercent(v) : formatLevel(v))}
            />
          )}
        />
        {/* Drawn first so the Level lines sit on top of the shaded area. */}
        <Area
          yAxisId="difference"
          dataKey="difference"
          name="Cumulative Difference"
          type="linear"
          baseValue={0}
          stroke={CHART_THEME.difference}
          strokeWidth={1}
          fill={CHART_THEME.differenceFill}
          fillOpacity={1}
          isAnimationActive={false}
        />
        <Line
          yAxisId="level"
          dataKey="benchmark"
          name="Benchmark"
          type="linear"
          stroke={CHART_THEME.benchmark}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          yAxisId="level"
          dataKey="strategy"
          name="Strategy"
          type="linear"
          stroke={CHART_THEME.strategy}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
