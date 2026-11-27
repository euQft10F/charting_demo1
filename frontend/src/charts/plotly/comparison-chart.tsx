import type { Data, Layout } from 'plotly.js'

import { formatLevel, formatPercent } from '@/charts/format'
import { PlotlyChart } from '@/charts/plotly/plotly-chart'
import { baseLayout, DATE_AXIS, lineTrace, VALUE_AXIS, windowKey } from '@/charts/plotly/shared'
import type { ComparisonChartProps } from '@/charts/types'
import { oppositeSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'

/**
 * Plotly.js renderer for the Comparison Chart: Levels plus the Cumulative Difference on the other axis.
 *
 * An overlaying axis always draws above the axis it overlays, whatever the trace order, so the
 * Cumulative Difference takes the base axis `y` and the Levels the overlay `y2`: that keeps the
 * shaded area behind the lines.
 */
export function ComparisonChart({ dates, benchmark, strategy, difference, logScale, axisSide }: ComparisonChartProps) {
  // Listed in tooltip order: the unified tooltip follows the trace order.
  const data: Data[] = [
    lineTrace('Benchmark', dates, benchmark, CHART_THEME.benchmark, formatLevel, { yaxis: 'y2' }),
    lineTrace('Strategy', dates, strategy, CHART_THEME.strategy, formatLevel, { yaxis: 'y2' }),
    lineTrace('Cumulative Difference', dates, difference, CHART_THEME.difference, formatPercent, {
      fill: 'tozeroy',
      fillcolor: CHART_THEME.differenceFill,
      line: { color: CHART_THEME.difference, width: 1 },
    }),
  ]

  const layout: Partial<Layout> = {
    // Switching log/linear changes the axis units, so it resets the zoom along with the Window.
    ...baseLayout(`${windowKey(dates)}/${logScale}`),
    xaxis: DATE_AXIS,
    // The Level axis owns the grid; the Cumulative Difference axis would draw a second, offset one.
    yaxis: { ...VALUE_AXIS, side: oppositeSide(axisSide), ticksuffix: '%', showgrid: false },
    yaxis2: {
      ...VALUE_AXIS,
      overlaying: 'y',
      // An overlaying axis defaults to ticks synced to the axis it overlays (odd values like 181.8,
      // and no grid of its own); the Level axis wants its own round ticks.
      tickmode: 'auto',
      showgrid: true,
      side: axisSide,
      type: logScale ? 'log' : 'linear',
    },
  }

  return <PlotlyChart data={data} layout={layout} />
}
