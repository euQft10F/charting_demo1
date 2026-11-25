import { useMemo, useState } from 'react'

import { BarChart } from '@/charts/lwc/bar-chart'
import { ChartCard } from '@/components/chart-card'
import { DEFAULT_PERIOD_COUNT, PeriodCountField } from '@/components/period-count-field'
import { WindowFields } from '@/components/window-fields'
import type { IndicesResponse } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'
import { useDrawdownPerformance } from '@/lib/queries'
import { useWindowForm } from '@/lib/window-form'

interface DrawdownPerformanceCardProps {
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side: where the value axis sits. */
  axisSide: AxisSide
}

export function DrawdownPerformanceCard({ history, axisSide }: DrawdownPerformanceCardProps) {
  const { form, applied, range } = useWindowForm(history)
  const [count, setCount] = useState(DEFAULT_PERIOD_COUNT)

  const performance = useDrawdownPerformance(applied.benchmark, applied.strategy, range, count)

  // The backend returns fractions, Benchmark first; the chart shows %.
  const bars = useMemo(
    () =>
      performance.data?.series.map((s, i) => ({
        color: i === 0 ? CHART_THEME.benchmark : CHART_THEME.strategy,
        values: s.values.map((v) => v * 100),
      })),
    [performance.data],
  )
  const [benchmark, strategy] = performance.data?.series ?? []

  return (
    <ChartCard
      title="Drawdown Performance Chart"
      description="Return of the Benchmark and Strategy from the start to the end of each of the Benchmark's deepest Drawdown Periods."
      controls={
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <WindowFields control={form.control} indices={history.indices} />
          <PeriodCountField value={count} onChange={setCount} />
        </div>
      }
      legend={benchmark && strategy && { benchmark: benchmark.name, strategy: strategy.name }}
      isFetching={performance.isFetching}
      error={performance.error}
      emptyReason={
        performance.data && performance.data.categories.length === 0
          ? 'No Drawdown Periods in this Window.'
          : undefined
      }
    >
      {performance.data && bars && (
        <BarChart categories={performance.data.categories} series={bars} axisSide={axisSide} />
      )}
    </ChartCard>
  )
}
