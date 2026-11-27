import { useState } from 'react'

import type { CardProps } from '@/cards/card-props'
import { ChartCard } from '@/components/chart-card'
import { DEFAULT_PERIOD_COUNT, PeriodCountField } from '@/components/period-count-field'
import { WindowFields } from '@/components/window-fields'
import { toBarSeries } from '@/lib/bars'
import { useDrawdownPerformance } from '@/lib/queries'
import { useWindowForm } from '@/lib/window-form'

export function DrawdownPerformanceCard({ history, axisSide, libraries }: CardProps) {
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
