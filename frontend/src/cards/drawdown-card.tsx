import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { DrawdownChart } from '@/charts/lwc/drawdown-chart'
import { ChartCard } from '@/components/chart-card'
import { WindowFields } from '@/components/window-fields'
import { defaultWindowValues, refineWindow, toWindow, useAppliedValues, windowShape } from '@/lib/window-form'
import type { IndicesResponse } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'
import { useDrawdowns } from '@/lib/queries'
import { resolveWindow, type DateRange } from '@/lib/window'

interface DrawdownCardProps {
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side: where the Drawdown axis sits. */
  axisSide: AxisSide
}

export function DrawdownCard({ history, axisSide }: DrawdownCardProps) {
  const { indices } = history
  const available: DateRange = history
  const schema = useMemo(() => z.object(windowShape).superRefine(refineWindow(available)), [available])
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultWindowValues(available),
    mode: 'onChange',
  })
  const values = useWatch({ control: form.control })
  const applied = useAppliedValues(schema, values)

  const range = resolveWindow(toWindow(applied), available)
  const drawdowns = useDrawdowns(applied.benchmark, applied.strategy, range)
  const data = drawdowns.data

  return (
    <ChartCard
      title="Drawdown Chart"
      description="Drawdowns of the Benchmark and Strategy over the Window."
      controls={<WindowFields control={form.control} indices={indices} />}
      legend={data && { benchmark: data.benchmark.name, strategy: data.strategy.name }}
      isFetching={drawdowns.isFetching}
      error={drawdowns.error}
      emptyReason={data && data.dates.length < 2 ? 'Not enough data in this Window.' : undefined}
    >
      {data && (
        <DrawdownChart
          dates={data.dates}
          benchmark={data.benchmark.values}
          strategy={data.strategy.values}
          axisSide={axisSide}
        />
      )}
    </ChartCard>
  )
}
