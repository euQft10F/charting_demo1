import { useState } from 'react'

import { ComparisonCard } from '@/cards/comparison-card'
import { DrawdownCard } from '@/cards/drawdown-card'
import { DrawdownPerformanceCard } from '@/cards/drawdown-performance-card'
import { DrawdownPeriodsCard } from '@/cards/drawdown-periods-card'
import { PerformanceBucketsCard } from '@/cards/performance-buckets-card'
import { SegmentedField } from '@/components/segmented-field'
import { Spinner } from '@/components/ui/spinner'
import { DEFAULT_AXIS_SIDE, type AxisSide } from '@/lib/axis-side'
import {
  CHARTING_LIBRARIES,
  CHARTING_LIBRARY_LABELS,
  DEFAULT_CHARTING_LIBRARY,
  type ChartingLibrary,
} from '@/lib/charting-library'
import type { IndicesResponse } from '@/lib/api'
import { useIndices } from '@/lib/queries'
import { cn } from '@/lib/utils'

/** The dashboard shows every chart in one Charting Library; Compare shows one chart in all of them. */
const VIEWS = ['dashboard', 'compare'] as const
type View = (typeof VIEWS)[number]
const VIEW_LABELS: Record<View, string> = { dashboard: 'Dashboard', compare: 'Compare libraries' }

const CHARTS = ['comparison', 'drawdown', 'drawdown-periods', 'performance-buckets', 'drawdown-performance'] as const
type Chart = (typeof CHARTS)[number]
const CHART_LABELS: Record<Chart, string> = {
  comparison: 'Comparison',
  drawdown: 'Drawdown',
  'drawdown-periods': 'Drawdown Periods',
  'performance-buckets': 'Performance Buckets',
  'drawdown-performance': 'Drawdown Performance',
}

export default function App() {
  const indices = useIndices()
  // One Axis Side for every chart; not persisted, so it resets on reload.
  const [axisSide, setAxisSide] = useState<AxisSide>(DEFAULT_AXIS_SIDE)
  // One Charting Library for every card. Only the renderers change: the cards keep their forms and
  // cached query data, so switching library makes no backend requests.
  const [library, setLibrary] = useState<ChartingLibrary>(DEFAULT_CHARTING_LIBRARY)
  const [view, setView] = useState<View>('dashboard')
  // The chart shown in the compare view. A card keeps its form while it stays on screen; one that
  // leaves and comes back starts afresh, though data fetched with the same parameters is cached.
  const [compared, setCompared] = useState<Chart>('comparison')

  return (
    <div className="min-h-svh">
      <header className="border-b-4 border-primary bg-card px-6 py-4">
        <h1 className="text-xl font-semibold">
          Performance <span className="text-primary">Charting</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Compare a Strategy against a Benchmark over any Window.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
          <SegmentedField label="View" options={VIEWS} labels={VIEW_LABELS} value={view} onChange={setView} />
          {view === 'dashboard' ? (
            <SegmentedField
              label="Charting Library"
              options={CHARTING_LIBRARIES}
              labels={CHARTING_LIBRARY_LABELS}
              value={library}
              onChange={setLibrary}
            />
          ) : (
            <SegmentedField label="Chart" options={CHARTS} labels={CHART_LABELS} value={compared} onChange={setCompared} />
          )}
        </div>
      </header>
      <main className={cn('mx-auto flex flex-col gap-6 p-6', view === 'dashboard' ? 'max-w-6xl' : 'max-w-[100rem]')}>
        {indices.isPending ? (
          <div className="flex justify-center p-12">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : indices.isError ? (
          <p className="text-destructive">Could not reach the backend: {indices.error.message}</p>
        ) : (
          <>
            {(view === 'dashboard' ? CHARTS : [compared]).map((chart) => (
              <ChartCardFor
                key={chart}
                chart={chart}
                history={indices.data}
                axisSide={axisSide}
                libraries={view === 'dashboard' ? [library] : CHARTING_LIBRARIES}
                onAxisSideChange={setAxisSide}
              />
            ))}
          </>
        )}
      </main>
    </div>
  )
}

interface ChartCardForProps {
  /** Which chart's card to show. */
  chart: Chart
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side. */
  axisSide: AxisSide
  /** The Charting Libraries that render the chart. */
  libraries: readonly ChartingLibrary[]
  /** Changes the shared Axis Side; only the Comparison Chart card offers the control. */
  onAxisSideChange: (side: AxisSide) => void
}

/** The card for one chart, rendered by the given Charting Libraries. */
function ChartCardFor({ chart, onAxisSideChange, ...props }: ChartCardForProps) {
  switch (chart) {
    case 'comparison':
      return <ComparisonCard {...props} onAxisSideChange={onAxisSideChange} />
    case 'drawdown':
      return <DrawdownCard {...props} />
    case 'drawdown-periods':
      return <DrawdownPeriodsCard {...props} />
    case 'performance-buckets':
      return <PerformanceBucketsCard {...props} />
    case 'drawdown-performance':
      return <DrawdownPerformanceCard {...props} />
  }
}
