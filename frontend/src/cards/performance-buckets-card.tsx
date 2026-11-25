import { useMemo, useState } from 'react'

import { BarChart } from '@/charts/lwc/bar-chart'
import { ChartCard } from '@/components/chart-card'
import { SegmentedField } from '@/components/segmented-field'
import { WindowFields } from '@/components/window-fields'
import { RETURN_FREQUENCIES, type IndicesResponse, type ReturnFrequency } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'
import { usePerformanceBuckets } from '@/lib/queries'
import { useWindowForm } from '@/lib/window-form'

interface PerformanceBucketsCardProps {
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side: where the value axis sits. */
  axisSide: AxisSide
}

export function PerformanceBucketsCard({ history, axisSide }: PerformanceBucketsCardProps) {
  const { form, applied, range } = useWindowForm(history)
  const [frequency, setFrequency] = useState<ReturnFrequency>('daily')

  const buckets = usePerformanceBuckets({
    benchmark: applied.benchmark,
    strategy: applied.strategy,
    ...range,
    frequency,
  })

  // The backend returns fractions, Benchmark first; the chart shows %.
  const bars = useMemo(
    () =>
      buckets.data?.series.map((s, i) => ({
        color: i === 0 ? CHART_THEME.benchmark : CHART_THEME.strategy,
        values: s.values.map((v) => v * 100),
      })),
    [buckets.data],
  )
  const [benchmark, strategy] = buckets.data?.series ?? []

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
      isFetching={buckets.isFetching}
      error={buckets.error}
      emptyReason={
        buckets.data && buckets.data.categories.length === 0 ? 'Not enough data in this Window.' : undefined
      }
    >
      {buckets.data && bars && <BarChart categories={buckets.data.categories} series={bars} axisSide={axisSide} />}
    </ChartCard>
  )
}
