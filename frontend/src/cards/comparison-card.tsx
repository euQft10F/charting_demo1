import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { LevelsChart } from '@/charts/lwc/levels-chart'
import { ChartCard } from '@/components/chart-card'
import { WindowFields } from '@/components/window-fields'
import { defaultWindowValues, refineWindow, toWindow, useAppliedValues, windowShape } from '@/lib/window-form'
import { useLevels } from '@/lib/queries'
import { DEFAULT_PRESET, resolveWindow, sliceLevels, type DateRange } from '@/lib/window'

interface CardProps {
  indices: string[]
  available: DateRange
}

export function ComparisonCard({ indices, available }: CardProps) {
  const schema = useMemo(() => z.object(windowShape).superRefine(refineWindow(available)), [available])
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultWindowValues(available),
    mode: 'onChange',
  })
  const values = useWatch({ control: form.control })
  const applied = useAppliedValues(schema, values)

  const levels = useLevels(applied.benchmark, applied.strategy)
  const sliced = useMemo(
    () => levels.data && sliceLevels(levels.data, resolveWindow(toWindow(applied), available)),
    [levels.data, applied, available],
  )

  return (
    <ChartCard
      title="Comparison Chart"
      description="Levels of the Benchmark and Strategy over the Window."
      controls={<WindowFields control={form.control} indices={indices} preset={values.preset ?? DEFAULT_PRESET} />}
      legend={sliced && { benchmark: sliced.benchmark.name, strategy: sliced.strategy.name }}
      isFetching={levels.isFetching}
      error={levels.error}
      emptyReason={sliced && sliced.dates.length < 2 ? 'Not enough data in this Window.' : undefined}
    >
      {sliced && (
        <LevelsChart
          dates={sliced.dates}
          benchmark={sliced.benchmark.values}
          strategy={sliced.strategy.values}
        />
      )}
    </ChartCard>
  )
}
