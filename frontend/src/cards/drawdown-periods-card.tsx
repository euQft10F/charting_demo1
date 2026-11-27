import { useState } from 'react'

import type { CardProps } from '@/cards/card-props'
import { ChartCard } from '@/components/chart-card'
import { LabelledCheckbox } from '@/components/labelled-checkbox'
import { DEFAULT_PERIOD_COUNT, PeriodCountField } from '@/components/period-count-field'
import { WindowFields } from '@/components/window-fields'
import type { DrawdownPeriod } from '@/lib/api'
import { useDrawdownPeriods, useWindowLevels } from '@/lib/queries'
import type { DateRange } from '@/lib/window'
import { useWindowForm } from '@/lib/window-form'

/** Shown instead of the bands while they load: the previous Window's bands would sit in the wrong place. */
const NO_PERIODS: DrawdownPeriod[] = []

export function DrawdownPeriodsCard({ history, axisSide, libraries }: CardProps) {
  const { indices } = history
  const available: DateRange = history
  const { form, applied, range } = useWindowForm(available)
  const [count, setCount] = useState(DEFAULT_PERIOD_COUNT)
  const [rebased, setRebased] = useState(false)

  const { levels, sliced, shown } = useWindowLevels(applied.benchmark, applied.strategy, range, rebased)
  const periods = useDrawdownPeriods(applied.benchmark, range, count)

  return (
    <ChartCard
      title="Drawdown Periods Chart"
      description="Levels of the Benchmark and Strategy, with the Benchmark's deepest Drawdown Periods shaded from peak to trough."
      controls={
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <WindowFields control={form.control} indices={indices} />
          <PeriodCountField value={count} onChange={setCount} />
          <LabelledCheckbox label="Rebase to 100" checked={rebased} onCheckedChange={setRebased} />
        </div>
      }
      legend={sliced && { benchmark: sliced.benchmark.name, strategy: sliced.strategy.name }}
      libraries={libraries}
      isFetching={levels.isFetching || periods.isFetching}
      error={levels.error ?? periods.error}
      emptyReason={sliced && sliced.dates.length < 2 ? 'Not enough data in this Window.' : undefined}
      renderChart={
        sliced && shown &&
        (({ DrawdownPeriodsChart }) => (
          <DrawdownPeriodsChart
            dates={sliced.dates}
            benchmark={shown.benchmark}
            strategy={shown.strategy}
            periods={periods.isPlaceholderData ? NO_PERIODS : (periods.data?.periods ?? NO_PERIODS)}
            axisSide={axisSide}
          />
        ))
      }
    />
  )
}
