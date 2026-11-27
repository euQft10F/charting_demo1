import type { Data, Layout } from 'plotly.js'

import { FLAT_DRAWDOWN_RANGE, hasDrawdown } from '@/charts/drawdown-axis'
import { PlotlyChart } from '@/charts/plotly/plotly-chart'
import { baseLayout, DATE_AXIS, lineTrace, PERCENT_HOVER, VALUE_AXIS, windowKey } from '@/charts/plotly/shared'
import type { DrawdownChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/** Plotly.js renderer for the Drawdown Chart: both Drawdowns, overlaid, hanging from 0. */
export function DrawdownChart({ dates, benchmark, strategy, axisSide }: DrawdownChartProps) {
  // The Benchmark is drawn first, so the Strategy overlays it. A missing Index draws nothing.
  const data: Data[] = []
  if (benchmark) {
    data.push(
      lineTrace('Benchmark', dates, benchmark, CHART_THEME.benchmark, {
        fill: 'tozeroy',
        fillcolor: CHART_THEME.benchmarkFill,
        hovertemplate: PERCENT_HOVER,
      }),
    )
  }
  if (strategy) {
    data.push(
      lineTrace('Strategy', dates, strategy, CHART_THEME.strategy, {
        fill: 'tozeroy',
        fillcolor: CHART_THEME.strategyFill,
        hovertemplate: PERCENT_HOVER,
      }),
    )
  }

  const layout: Partial<Layout> = {
    ...baseLayout(windowKey(dates)),
    xaxis: DATE_AXIS,
    yaxis: {
      ...VALUE_AXIS,
      side: axisSide,
      ticksuffix: '%',
      // Autorange pads past 0, so cap the top at 0.
      ...(hasDrawdown(benchmark, strategy)
        ? { autorange: true, autorangeoptions: { maxallowed: 0 } }
        : { range: FLAT_DRAWDOWN_RANGE, autorange: false }),
    },
  }

  return <PlotlyChart data={data} layout={layout} />
}
