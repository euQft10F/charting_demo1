import type { EChartsOption, LineSeriesOption } from 'echarts'

import { EChart } from '@/charts/echarts/echart'
import { axisTooltip, lineSeries, shadedArea, TIME_SERIES_OPTION, toData, valueAxis } from '@/charts/echarts/shared'
import { formatPercent } from '@/charts/format'
import type { DrawdownChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/** ECharts renderer for the Drawdown Chart: both Drawdowns, overlaid, hanging from 0. */
export function DrawdownChart({ dates, benchmark, strategy, axisSide }: DrawdownChartProps) {
  const flat = ![benchmark, strategy].some((values) => values?.some((v) => v < 0))
  // The Benchmark comes first, so the Strategy overlays it. A missing Index draws nothing.
  const series = [
    { id: 'benchmark', name: 'Benchmark', values: benchmark, color: CHART_THEME.benchmark, fill: CHART_THEME.benchmarkFill },
    { id: 'strategy', name: 'Strategy', values: strategy, color: CHART_THEME.strategy, fill: CHART_THEME.strategyFill },
  ].flatMap(({ id, name, values, color, fill }): LineSeriesOption[] =>
    values ? [{ ...lineSeries(id, name, color, toData(dates, values)), areaStyle: shadedArea(fill) }] : [],
  )

  const option: EChartsOption = {
    ...TIME_SERIES_OPTION,
    tooltip: axisTooltip({ formatValue: formatPercent }),
    // Drawdowns are never above 0, so the axis tops out at 0. A Window with no Drawdown at all is
    // flat at 0; give it room below so 0 stays the top.
    yAxis: { ...valueAxis(axisSide, formatPercent), max: 0, min: flat ? -1 : undefined },
    series,
  }

  return <EChart option={option} resetOn={dates} />
}
