import { DrawdownChart } from '@/charts/lwc/drawdown-chart'
import { ChartCard } from '@/components/chart-card'
import { WindowFields } from '@/components/window-fields'
import { useWindowForm } from '@/lib/window-form'
import type { IndicesResponse } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'
import { useDrawdowns } from '@/lib/queries'
import type { DateRange } from '@/lib/window'

interface DrawdownCardProps {
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side: where the Drawdown axis sits. */
  axisSide: AxisSide
}

export function DrawdownCard({ history, axisSide }: DrawdownCardProps) {
  const { indices } = history
  const available: DateRange = history
  const { form, applied, range } = useWindowForm(available, { optionalIndices: true })
  const drawdowns = useDrawdowns(applied.benchmark, applied.strategy, range)
  const data = drawdowns.data

  return (
    <ChartCard
      title="Drawdown Chart"
      description="Drawdowns of the Benchmark and Strategy over the Window; set either to None to show just one."
      controls={<WindowFields control={form.control} indices={indices} optionalIndices />}
      legend={data && { benchmark: data.benchmark?.name, strategy: data.strategy?.name }}
      isFetching={drawdowns.isFetching}
      error={drawdowns.error}
      emptyReason={data && data.dates.length < 2 ? 'Not enough data in this Window.' : undefined}
    >
      {data && (
        <DrawdownChart
          dates={data.dates}
          benchmark={data.benchmark?.values}
          strategy={data.strategy?.values}
          axisSide={axisSide}
        />
      )}
    </ChartCard>
  )
}
