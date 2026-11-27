import { useState } from 'react'

import { ChartCard } from '@/components/chart-card'
import { LabelledCheckbox } from '@/components/labelled-checkbox'
import { WindowFields } from '@/components/window-fields'
import { useWindowForm } from '@/lib/window-form'
import type { IndicesResponse } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'
import type { ChartingLibrary } from '@/lib/charting-library'
import { CHART_THEME } from '@/lib/colors'
import { cumulativeDifference } from '@/lib/comparison'
import { useWindowLevels } from '@/lib/queries'
import type { DateRange } from '@/lib/window'

interface ComparisonCardProps {
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side: where the Level axis sits. */
  axisSide: AxisSide
  /** The Charting Libraries that render the chart: the global one on the dashboard, all of them side by side in the compare view. */
  libraries: readonly ChartingLibrary[]
  onAxisSideChange: (side: AxisSide) => void
}

export function ComparisonCard({ history, axisSide, libraries, onAxisSideChange }: ComparisonCardProps) {
  const { indices } = history
  const available: DateRange = history
  const { form, applied, range } = useWindowForm(available)
  const [rebased, setRebased] = useState(false)
  const [logScale, setLogScale] = useState(false)

  const { levels, sliced, shown } = useWindowLevels(applied.benchmark, applied.strategy, range, rebased)

  // Cumulative Difference ignores Rebase, so toggling Rebase leaves it untouched.
  const difference = sliced && cumulativeDifference(sliced.benchmark.values, sliced.strategy.values)

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
      libraries={libraries}
      isFetching={levels.isFetching}
      error={levels.error}
      emptyReason={sliced && sliced.dates.length < 2 ? 'Not enough data in this Window.' : undefined}
      renderChart={
        sliced && shown && difference &&
        (({ ComparisonChart }) => (
          <ComparisonChart
            dates={sliced.dates}
            benchmark={shown.benchmark}
            strategy={shown.strategy}
            difference={difference}
            logScale={logScale}
            axisSide={axisSide}
          />
        ))
      }
    />
  )
}
