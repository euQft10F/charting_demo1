import type { Data, Layout } from 'plotly.js'

import { PlotlyChart } from '@/charts/plotly/plotly-chart'
import { baseLayout, DATE_AXIS, PERCENT_HOVER, VALUE_AXIS, windowKey } from '@/charts/plotly/shared'
import type { DrawdownChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/** A Drawdown hanging from 0 as a filled area, in its Index's line and fill colours. */
function drawdownTrace(name: string, dates: string[], values: number[], colors: { line: string; fill: string }): Data {
  return {
    type: 'scatter',
    mode: 'lines',
    name,
    x: dates,
    y: values,
    fill: 'tozeroy',
    fillcolor: colors.fill,
    line: { color: colors.line, width: 2 },
    hovertemplate: PERCENT_HOVER,
  }
}

/** Plotly.js renderer for the Drawdown Chart: both Drawdowns, overlaid, hanging from 0. */
export function DrawdownChart({ dates, benchmark, strategy, axisSide }: DrawdownChartProps) {
  // The Benchmark is drawn first, so the Strategy overlays it. A missing Index draws nothing.
  const data: Data[] = []
  if (benchmark) {
    data.push(drawdownTrace('Benchmark', dates, benchmark, { line: CHART_THEME.benchmark, fill: CHART_THEME.benchmarkFill }))
  }
  if (strategy) {
    data.push(drawdownTrace('Strategy', dates, strategy, { line: CHART_THEME.strategy, fill: CHART_THEME.strategyFill }))
  }
  const flat = ![benchmark, strategy].some((values) => values?.some((v) => v < 0))

  const layout: Partial<Layout> = {
    ...baseLayout(windowKey(dates)),
    xaxis: DATE_AXIS,
    yaxis: {
      ...VALUE_AXIS,
      side: axisSide,
      ticksuffix: '%',
      // Drawdowns are never above 0: autorange pads past it, so cap the top at 0. A Window with no
      // Drawdown at all is flat at 0; give it room below so 0 stays the top.
      ...(flat ? { range: [-1, 0], autorange: false } : { autorange: true, autorangeoptions: { maxallowed: 0 } }),
    },
  }

  return <PlotlyChart data={data} layout={layout} />
}
