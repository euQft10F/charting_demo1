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

  // Cumulative Difference ignores Rebase, so toggling Rebase leaves it untouched.
  const difference = useMemo(
    () => sliced && cumulativeDifference(sliced.benchmark.values, sliced.strategy.values),
    [sliced],
  )
  const shown = useMemo(() => {
    if (!sliced) return undefined
    const level = rebased ? rebase : (values: number[]) => values
    return { benchmark: level(sliced.benchmark.values), strategy: level(sliced.strategy.values) }
  }, [sliced, rebased])

  return (
    <ChartCard
      title="Comparison Chart"
      description="Levels of the Benchmark and Strategy over the Window, with their Cumulative Difference."
      controls={
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <WindowFields control={form.control} indices={indices} />
          <LabelledCheckbox label="Rebase to 100" checked={rebased} onCheckedChange={setRebased} />
          <LabelledCheckbox label="Log scale" checked={logScale} onCheckedChange={setLogScale} />
          <LabelledCheckbox
            label="Y-axis on left"
            checked={axisSide === 'left'}
            onCheckedChange={(left) => onAxisSideChange(left ? 'left' : 'right')}
          />
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
      {sliced && shown && difference && (
        <ComparisonChart
          dates={sliced.dates}
          benchmark={shown.benchmark}
          strategy={shown.strategy}
          difference={difference}
          logScale={logScale}
          axisSide={axisSide}
        />
      )}
    </ChartCard>
  )
}
