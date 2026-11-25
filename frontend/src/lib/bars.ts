import type { BarsResponse } from '@/lib/api'
import { CHART_THEME } from '@/lib/colors'

/**
 * The series of a bar-chart response as the bar chart draws them. The backend returns fractions,
 * Benchmark first, then Strategy; the chart shows %, with the Benchmark grey and Strategy red.
 */
export function toBarSeries(series: BarsResponse['series']) {
  return series.map((s, i) => ({
    name: s.name,
    color: i === 0 ? CHART_THEME.benchmark : CHART_THEME.strategy,
    values: s.values.map((v) => v * 100),
  }))
}
