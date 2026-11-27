import type { EChartsOption } from 'echarts'

import { EChart } from '@/charts/echarts/echart'
import {
  axisTooltip,
  dateAxis,
  GRID,
  lineSeries,
  logAxis,
  shadedArea,
  toData,
  valueAxis,
  ZOOM,
} from '@/charts/echarts/shared'
import { formatFullDate, formatLevel, formatPercent } from '@/charts/format'
import type { ComparisonChartProps } from '@/charts/types'
import { oppositeSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'

/** ECharts renderer for the Comparison Chart: Levels plus the Cumulative Difference on the other axis. */
export function ComparisonChart({ dates, benchmark, strategy, difference, logScale, axisSide }: ComparisonChartProps) {
  const levelAxis = logScale
    ? logAxis(axisSide, formatLevel, [benchmark, strategy])
    : valueAxis(axisSide, formatLevel, { scale: true })

  const option: EChartsOption = {
    animation: false,
    grid: GRID,
    dataZoom: ZOOM,
    tooltip: axisTooltip({
      formatLabel: formatFullDate,
      formatValue: (v, id) => (id === 'difference' ? formatPercent(v) : formatLevel(v)),
    }),
    xAxis: dateAxis(),
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
