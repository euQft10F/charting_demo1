import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { ComparisonChart } from '@/charts/lwc/comparison-chart'
import { ChartCard } from '@/components/chart-card'
import { LabelledCheckbox } from '@/components/labelled-checkbox'
import { WindowFields } from '@/components/window-fields'
import { defaultWindowValues, refineWindow, toWindow, useAppliedValues, windowShape } from '@/lib/window-form'
import type { IndicesResponse } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'
import { cumulativeDifference, rebase } from '@/lib/comparison'
import { useLevels } from '@/lib/queries'
import { resolveWindow, sliceLevels, type DateRange } from '@/lib/window'

interface ComparisonCardProps {
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side: where the Level axis sits. */
  axisSide: AxisSide
  onAxisSideChange: (side: AxisSide) => void
}

export function ComparisonCard({ history, axisSide, onAxisSideChange }: ComparisonCardProps) {
  const { indices } = history
  const available: DateRange = history
  const schema = useMemo(() => z.object(windowShape).superRefine(refineWindow(available)), [available])
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultWindowValues(available),
    mode: 'onChange',
  })
  const [rebased, setRebased] = useState(false)
  const [logScale, setLogScale] = useState(false)
  const values = useWatch({ control: form.control })
  const applied = useAppliedValues(schema, values)

  const levels = useLevels(applied.benchmark, applied.strategy)
  const sliced = useMemo(
    () => levels.data && sliceLevels(levels.data, resolveWindow(toWindow(applied), available)),
    [levels.data, applied, available],
  )

  const series = useMemo(() => {
    if (!sliced) return undefined
    const { benchmark, strategy } = sliced
    return {
      benchmark: rebased ? rebase(benchmark.values) : benchmark.values,
      strategy: rebased ? rebase(strategy.values) : strategy.values,
      difference: cumulativeDifference(benchmark.values, strategy.values),
    }
  }, [sliced, rebased])

  return (
    <ChartCard
      title="Comparison Chart"
      description="Levels of the Benchmark and Strategy over the Window, with their Cumulative Difference."
      controls={
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <WindowFields control={form.control} indices={indices} />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 self-end">
            <LabelledCheckbox label="Rebase to 100" checked={rebased} onCheckedChange={setRebased} />
            <LabelledCheckbox label="Log scale" checked={logScale} onCheckedChange={setLogScale} />
            <LabelledCheckbox
              label="Y-axis on left"
              checked={axisSide === 'left'}
              onCheckedChange={(left) => onAxisSideChange(left ? 'left' : 'right')}
            />
          </div>
        </div>
      }
      legend={
        sliced && {
          benchmark: sliced.benchmark.name,
          strategy: sliced.strategy.name,
          extras: [{ color: CHART_THEME.difference, label: 'Cumulative Difference (%)' }],
        }
      }
      isFetching={levels.isFetching}
      error={levels.error}
      emptyReason={sliced && sliced.dates.length < 2 ? 'Not enough data in this Window.' : undefined}
    >
      {sliced && series && (
        <ComparisonChart
          dates={sliced.dates}
          benchmark={series.benchmark}
          strategy={series.strategy}
          difference={series.difference}
          logScale={logScale}
          axisSide={axisSide}
        />
      )}
    </ChartCard>
  )
}
