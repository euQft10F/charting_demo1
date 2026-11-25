import { useId, useMemo, useState } from 'react'

import { DrawdownPeriodsChart } from '@/charts/lwc/drawdown-periods-chart'
import { ChartCard } from '@/components/chart-card'
import { LabelledCheckbox } from '@/components/labelled-checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WindowFields } from '@/components/window-fields'
import type { IndicesResponse } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'
import { rebase } from '@/lib/comparison'
import { useDrawdownPeriods, useLevels } from '@/lib/queries'
import { sliceLevels, type DateRange } from '@/lib/window'
import { useWindowForm } from '@/lib/window-form'

/** How many of the Benchmark's deepest Drawdown Periods can be shaded. */
const PERIOD_COUNTS = Array.from({ length: 10 }, (_, i) => i + 1)
const DEFAULT_PERIOD_COUNT = 2

interface DrawdownPeriodsCardProps {
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side: where the Level axis sits. */
  axisSide: AxisSide
}

export function DrawdownPeriodsCard({ history, axisSide }: DrawdownPeriodsCardProps) {
  const { indices } = history
  const available: DateRange = history
  const { form, applied, range } = useWindowForm(available)
  const [count, setCount] = useState(DEFAULT_PERIOD_COUNT)
  const [rebased, setRebased] = useState(false)
  const countId = useId()

  const levels = useLevels(applied.benchmark, applied.strategy)
  const periods = useDrawdownPeriods(applied.benchmark, range, count)
  const sliced = useMemo(() => levels.data && sliceLevels(levels.data, range), [levels.data, range])
  const shown = useMemo(() => {
    if (!sliced) return undefined
    const level = rebased ? rebase : (values: number[]) => values
    return { benchmark: level(sliced.benchmark.values), strategy: level(sliced.strategy.values) }
  }, [sliced, rebased])

  return (
    <ChartCard
      title="Drawdown Periods Chart"
      description="Levels of the Benchmark and Strategy, with the Benchmark's deepest Drawdown Periods shaded from peak to trough."
      controls={
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <WindowFields control={form.control} indices={indices} />
          <Field className="w-28">
            <FieldLabel htmlFor={countId}>Periods shown</FieldLabel>
            <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
              <SelectTrigger id={countId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_COUNTS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <LabelledCheckbox label="Rebase to 100" checked={rebased} onCheckedChange={setRebased} />
        </div>
      }
      legend={sliced && { benchmark: sliced.benchmark.name, strategy: sliced.strategy.name }}
      isFetching={levels.isFetching || periods.isFetching}
      error={levels.error ?? periods.error}
      emptyReason={sliced && sliced.dates.length < 2 ? 'Not enough data in this Window.' : undefined}
    >
      {sliced && shown && periods.data && (
        <DrawdownPeriodsChart
          dates={sliced.dates}
          benchmark={shown.benchmark}
          strategy={shown.strategy}
          periods={periods.data.periods}
          axisSide={axisSide}
        />
      )}
    </ChartCard>
  )
}
