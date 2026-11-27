import type { Data, Layout } from 'plotly.js'

import { PlotlyChart } from '@/charts/plotly/plotly-chart'
import { baseLayout, DATE_AXIS, lineTrace, VALUE_AXIS, windowKey } from '@/charts/plotly/shared'
import type { DrawdownPeriodsChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/** Plotly.js renderer for the Drawdown Periods Chart: both Levels with shaded Periods. */
export function DrawdownPeriodsChart({ dates, benchmark, strategy, periods, axisSide }: DrawdownPeriodsChartProps) {
  const data: Data[] = [
    lineTrace('Benchmark', dates, benchmark, CHART_THEME.benchmark),
    lineTrace('Strategy', dates, strategy, CHART_THEME.strategy),
  ]
  // Shapes count towards the x autorange, so a Period outside this Window (mid-refresh) would
  // stretch the date axis; leave it out. ISO dates compare correctly as strings.
  const shown = periods.filter((p) => p.end >= dates[0] && p.start <= dates.at(-1)!)

  const layout: Partial<Layout> = {
    ...baseLayout(windowKey(dates)),
    xaxis: DATE_AXIS,
    yaxis: { ...VALUE_AXIS, side: axisSide },
    // Full-height bands (the y extent is in paper units), behind the lines. The date axis places
    // them by date, so they needn't fall on a date in the data.
    shapes: shown.map((p) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: p.start,
      x1: p.end,
      y0: 0,
      y1: 1,
      fillcolor: CHART_THEME.periodBand,
      line: { width: 0 },
      layer: 'below',
    })),
  }

  return <PlotlyChart data={data} layout={layout} />
}
