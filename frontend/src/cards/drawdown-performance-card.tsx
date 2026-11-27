import { useState } from 'react'

import { ChartCard } from '@/components/chart-card'
import { DEFAULT_PERIOD_COUNT, PeriodCountField } from '@/components/period-count-field'
import { WindowFields } from '@/components/window-fields'
import type { IndicesResponse } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'
import type { ChartingLibrary } from '@/lib/charting-library'
import { toBarSeries } from '@/lib/bars'
import { useDrawdownPerformance } from '@/lib/queries'
import { useWindowForm } from '@/lib/window-form'

interface DrawdownPerformanceCardProps {
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side: where the value axis sits. */
  axisSide: AxisSide
  /** The Charting Libraries that render the chart: the global one on the dashboard, all of them side by side in the compare view. */
  libraries: readonly ChartingLibrary[]
}

export function DrawdownPerformanceCard({ history, axisSide, libraries }: DrawdownPerformanceCardProps) {
  const { form, applied, range } = useWindowForm(history)
  const [count, setCount] = useState(DEFAULT_PERIOD_COUNT)

  const performance = useDrawdownPerformance(applied.benchmark, applied.strategy, range, count)

  const data = performance.data
  const bars = data && toBarSeries(data.series)
  const [benchmark, strategy] = data?.series ?? []

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
      libraries={libraries}
      isFetching={performance.isFetching}
      error={performance.error}
      emptyReason={data?.categories.length === 0 ? 'No Drawdown Periods in this Window.' : undefined}
      renderChart={
        data &&
        bars &&
        (({ BarChart }) => <BarChart categories={data.categories} series={bars} axisSide={axisSide} />)
      }
    />
  )
}
