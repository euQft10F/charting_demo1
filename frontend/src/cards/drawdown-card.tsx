import type { CardProps } from '@/cards/card-props'
import { ChartCard } from '@/components/chart-card'
import { WindowFields } from '@/components/window-fields'
import { useWindowForm } from '@/lib/window-form'
import { useDrawdowns } from '@/lib/queries'
import type { DateRange } from '@/lib/window'

export function DrawdownCard({ history, axisSide, libraries }: CardProps) {
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
      libraries={libraries}
      isFetching={drawdowns.isFetching}
      error={drawdowns.error}
      emptyReason={data && data.dates.length < 2 ? 'Not enough data in this Window.' : undefined}
      renderChart={
        data &&
        (({ DrawdownChart }) => (
          <DrawdownChart
            dates={data.dates}
            benchmark={data.benchmark?.values}
            strategy={data.strategy?.values}
            axisSide={axisSide}
          />
        ))
      }
    />
  )
}
