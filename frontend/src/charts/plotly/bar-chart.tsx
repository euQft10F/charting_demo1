import type { Data, Layout } from 'plotly.js'

import { PlotlyChart } from '@/charts/plotly/plotly-chart'
import { baseLayout, PERCENT_HOVER, VALUE_AXIS } from '@/charts/plotly/shared'
import type { BarChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/**
 * Plotly.js renderer for category bar charts: grouped bars with the categories as axis labels.
 * Values are percentages. Plotly.js has a native category axis and grouped bars.
 */
export function BarChart({ categories, series, axisSide }: BarChartProps) {
  const data: Data[] = series.map((s) => ({
    type: 'bar',
    name: s.name,
    x: categories,
    y: s.values,
    marker: { color: s.color },
    hovertemplate: PERCENT_HOVER,
  }))

  const layout: Partial<Layout> = {
    // Nothing to zoom along a handful of categories; the categories themselves are the revision.
    ...baseLayout(categories.join('|')),
    barmode: 'group',
    // 30% of each category is gap, matching the Lightweight Charts groups' 70% fill.
    bargap: 0.3,
    xaxis: { type: 'category', showgrid: false, automargin: true, fixedrange: true },
    yaxis: { ...VALUE_AXIS, side: axisSide, ticksuffix: '%', zeroline: true, zerolinecolor: CHART_THEME.zeroLine },
  }

  return <PlotlyChart data={data} layout={layout} />
}
