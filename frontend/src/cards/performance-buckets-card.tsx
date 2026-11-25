import { useMemo, useState } from 'react'

import { BarChart } from '@/charts/lwc/bar-chart'
import { ChartCard } from '@/components/chart-card'
import { LabelledCheckbox } from '@/components/labelled-checkbox'
import { WindowFields } from '@/components/window-fields'
import type { IndicesResponse } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'
import { usePerformanceBuckets } from '@/lib/queries'
import { resolveWindow } from '@/lib/window'
import { toWindow, useWindowForm } from '@/lib/window-form'

interface PerformanceBucketsCardProps {
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side: where the value axis sits. */
  axisSide: AxisSide
}

export function PerformanceBucketsCard({ history, axisSide }: PerformanceBucketsCardProps) {
  const { form, applied } = useWindowForm(history)
  const [annualised, setAnnualised] = useState(false)

  const { start, end } = resolveWindow(toWindow(applied), history)
  const buckets = usePerformanceBuckets({
    benchmark: applied.benchmark,
    strategy: applied.strategy,
    start,
    end,
    annualise: annualised,
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
      description={`${annualised ? 'Annualised mean' : 'Mean'} Daily Return of the Benchmark and Strategy in each Performance Bucket, ranked by the Benchmark's Daily Return.`}
      controls={
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <WindowFields control={form.control} indices={history.indices} />
          <LabelledCheckbox label="Annualise (×252)" checked={annualised} onCheckedChange={setAnnualised} />
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
