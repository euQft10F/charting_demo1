import type { EChartsOption, LineSeriesOption } from 'echarts'

import { FLAT_DRAWDOWN_RANGE, hasDrawdown } from '@/charts/drawdown-axis'
import { EChart } from '@/charts/echarts/echart'
import { axisTooltip, lineSeries, shadedArea, TIME_SERIES_OPTION, toData, valueAxis } from '@/charts/echarts/shared'
import { formatPercent } from '@/charts/format'
import type { DrawdownChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/** ECharts renderer for the Drawdown Chart: both Drawdowns, overlaid, hanging from 0. */
export function DrawdownChart({ dates, benchmark, strategy, axisSide }: DrawdownChartProps) {
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
    // Drawdowns are never above 0, so the axis tops out at 0; a flat Window takes FLAT_DRAWDOWN_RANGE.
    yAxis: {
      ...valueAxis(axisSide, formatPercent),
      max: 0,
      min: hasDrawdown(benchmark, strategy) ? undefined : FLAT_DRAWDOWN_RANGE[0],
    },
    series,
  }

  return <EChart option={option} resetOn={dates} />
}
