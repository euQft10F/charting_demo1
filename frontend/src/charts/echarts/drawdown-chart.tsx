import type { EChartsOption, LineSeriesOption } from 'echarts'

import { EChart } from '@/charts/echarts/echart'
import { axisTooltip, dateAxis, GRID, lineSeries, shadedArea, toData, valueAxis, ZOOM } from '@/charts/echarts/shared'
import { formatFullDate, formatPercent } from '@/charts/format'
import type { DrawdownChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/** ECharts renderer for the Drawdown Chart: both Drawdowns, overlaid, hanging from 0. */
export function DrawdownChart({ dates, benchmark, strategy, axisSide }: DrawdownChartProps) {
  const flat = ![benchmark, strategy].some((values) => values?.some((v) => v < 0))
  // The Benchmark comes first, so the Strategy overlays it. A missing Index draws nothing.
  const series: LineSeriesOption[] = []
  if (benchmark) {
    series.push({
      ...lineSeries('benchmark', 'Benchmark', CHART_THEME.benchmark, toData(dates, benchmark)),
      areaStyle: shadedArea(CHART_THEME.benchmarkFill),
    })
  }
  if (strategy) {
    series.push({
      ...lineSeries('strategy', 'Strategy', CHART_THEME.strategy, toData(dates, strategy)),
      areaStyle: shadedArea(CHART_THEME.strategyFill),
    })
  }

  const option: EChartsOption = {
    animation: false,
    grid: GRID,
    dataZoom: ZOOM,
    tooltip: axisTooltip({ formatLabel: formatFullDate, formatValue: formatPercent }),
    xAxis: dateAxis(),
    // Drawdowns are never above 0, so the axis tops out at 0. A Window with no Drawdown at all is
    // flat at 0; give it room below so 0 stays the top.
    yAxis: { ...valueAxis(axisSide, formatPercent, { scale: true }), max: 0, min: flat ? -1 : undefined },
    series,
  }

  return <EChart option={option} resetOn={dates} />
}
