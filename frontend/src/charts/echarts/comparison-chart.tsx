import type { EChartsOption } from 'echarts'

import { EChart } from '@/charts/echarts/echart'
import {
  axisTooltip,
  lineSeries,
  logAxis,
  shadedArea,
  TIME_SERIES_OPTION,
  toData,
  valueAxis,
} from '@/charts/echarts/shared'
import { formatLevel, formatPercent } from '@/charts/format'
import type { ComparisonChartProps } from '@/charts/types'
import { oppositeSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'

/** ECharts renderer for the Comparison Chart: Levels plus the Cumulative Difference on the other axis. */
export function ComparisonChart({ dates, benchmark, strategy, difference, logScale, axisSide }: ComparisonChartProps) {
  const levelAxis = logScale
    ? logAxis(axisSide, formatLevel, [benchmark, strategy])
    : valueAxis(axisSide, formatLevel, { scale: true })

  const option: EChartsOption = {
    ...TIME_SERIES_OPTION,
    tooltip: axisTooltip({ formatValue: (v, id) => (id === 'difference' ? formatPercent(v) : formatLevel(v)) }),
    yAxis: [levelAxis, valueAxis(oppositeSide(axisSide), formatPercent, { grid: false, scale: true })],
    // The tooltip lists series in this order; `z` puts the shaded area behind the Level lines.
    series: [
      lineSeries('benchmark', 'Benchmark', CHART_THEME.benchmark, toData(dates, benchmark)),
      lineSeries('strategy', 'Strategy', CHART_THEME.strategy, toData(dates, strategy)),
      {
        ...lineSeries('difference', 'Cumulative Difference', CHART_THEME.difference, toData(dates, difference)),
        yAxisIndex: 1,
        z: 1,
        lineStyle: { width: 1 },
        areaStyle: shadedArea(CHART_THEME.differenceFill),
      },
    ],
  }

  return <EChart option={option} resetOn={dates} />
}
