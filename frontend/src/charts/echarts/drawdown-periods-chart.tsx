import type { EChartsOption } from 'echarts'

import { EChart } from '@/charts/echarts/echart'
import { axisTooltip, dateAxis, GRID, lineSeries, toData, valueAxis, ZOOM } from '@/charts/echarts/shared'
import { formatFullDate, formatLevel } from '@/charts/format'
import type { DrawdownPeriodsChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/** ECharts renderer for the Drawdown Periods Chart: both Levels with shaded Periods. */
export function DrawdownPeriodsChart({ dates, benchmark, strategy, periods, axisSide }: DrawdownPeriodsChartProps) {
  const option: EChartsOption = {
    animation: false,
    grid: GRID,
    dataZoom: ZOOM,
    tooltip: axisTooltip({ formatLabel: formatFullDate, formatValue: formatLevel }),
    xAxis: dateAxis(),
    yAxis: valueAxis(axisSide, formatLevel, { scale: true }),
    series: [
      {
        ...lineSeries('benchmark', 'Benchmark', CHART_THEME.benchmark, toData(dates, benchmark)),
        // Full-height bands behind the lines. On a time axis a band can start and end on any date,
        // so a Period from a previous Window (mid-refresh) needs no special handling.
        markArea: {
          silent: true,
          itemStyle: { color: CHART_THEME.periodBand },
          data: periods.map((p) => [{ xAxis: p.start }, { xAxis: p.end }]),
        },
      },
      lineSeries('strategy', 'Strategy', CHART_THEME.strategy, toData(dates, strategy)),
    ],
  }

  return <EChart option={option} resetOn={dates} />
}
