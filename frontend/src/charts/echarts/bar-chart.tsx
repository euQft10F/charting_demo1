import type { BarSeriesOption, EChartsOption } from 'echarts'

import { EChart } from '@/charts/echarts/echart'
import { axisTooltip, BASE_OPTION, categoryAxis, valueAxis } from '@/charts/echarts/shared'
import { formatBarValue, formatPercent } from '@/charts/format'
import type { BarChartProps } from '@/charts/types'
import { CHART_THEME } from '@/lib/colors'

/** A solid line along 0, so bars above and below read against it. */
const ZERO_LINE: BarSeriesOption['markLine'] = {
  silent: true,
  symbol: 'none',
  label: { show: false },
  lineStyle: { color: CHART_THEME.zeroLine, type: 'solid', width: 1 },
  data: [{ yAxis: 0 }],
}

/**
 * ECharts renderer for category bar charts: grouped bars with the categories as axis labels.
 * Values are percentages. ECharts has a native category axis and groups bars itself.
 */
export function BarChart({ categories, series, axisSide }: BarChartProps) {
  const option: EChartsOption = {
    ...BASE_OPTION,
    tooltip: axisTooltip({ formatValue: formatBarValue, shadow: true }),
    xAxis: categoryAxis(categories),
    yAxis: valueAxis(axisSide, formatPercent),
    series: series.map(
      (s, j): BarSeriesOption => ({
        type: 'bar',
        // Keyed by position, since two series could share a name.
        id: `s${j}`,
        name: s.name,
        color: s.color,
        data: s.values,
        // 30% of each category is gap, matching the Lightweight Charts groups' 70% fill.
        barCategoryGap: '30%',
        barGap: '0%',
        markLine: j === 0 ? ZERO_LINE : undefined,
      }),
    ),
  }

  return <EChart option={option} resetOn={categories} />
}
