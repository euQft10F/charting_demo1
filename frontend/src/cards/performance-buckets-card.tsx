import { useState } from 'react'

import type { CardProps } from '@/cards/card-props'
import { ChartCard } from '@/components/chart-card'
import { SegmentedField } from '@/components/segmented-field'
import { WindowFields } from '@/components/window-fields'
import { RETURN_FREQUENCIES, type ReturnFrequency } from '@/lib/api'
import { toBarSeries } from '@/lib/bars'
import { usePerformanceBuckets } from '@/lib/queries'
import { useWindowForm } from '@/lib/window-form'

export function PerformanceBucketsCard({ history, axisSide, libraries }: CardProps) {
  const { form, applied, range } = useWindowForm(history)
  const [frequency, setFrequency] = useState<ReturnFrequency>('daily')

  const buckets = usePerformanceBuckets({
    benchmark: applied.benchmark,
    strategy: applied.strategy,
    ...range,
    frequency,
  })

  const data = buckets.data
  const bars = data && toBarSeries(data.series)
  const [benchmark, strategy] = data?.series ?? []

  return (
    <ChartCard
      title="Performance Buckets Chart"
      description={`Mean ${frequency} return of the Benchmark and Strategy in each Performance Bucket, ranked by the Benchmark's ${frequency} return.`}
      controls={
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <WindowFields control={form.control} indices={history.indices} />
          <SegmentedField label="Returns" options={RETURN_FREQUENCIES} value={frequency} onChange={setFrequency} />
        </div>
      }
      legend={benchmark && strategy && { benchmark: benchmark.name, strategy: strategy.name }}
      libraries={libraries}
      isFetching={buckets.isFetching}
      error={buckets.error}
      emptyReason={
        data && data.categories.length === 0 ? 'Not enough data in this Window.' : undefined
      }
      renderChart={
        data &&
        bars &&
        (({ BarChart }) => <BarChart categories={data.categories} series={bars} axisSide={axisSide} />)
      }
    />
  )
}
