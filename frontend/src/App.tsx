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
import { useIndices } from '@/lib/queries'

export default function App() {
  const indices = useIndices()
  // One Axis Side for every chart; not persisted, so it resets on reload.
  const [axisSide, setAxisSide] = useState<AxisSide>(DEFAULT_AXIS_SIDE)
  // One Charting Library for every card. Only the renderers change: the cards keep their forms and
  // cached query data, so switching library makes no backend requests.
  const [library, setLibrary] = useState<ChartingLibrary>(DEFAULT_CHARTING_LIBRARY)

  return (
    <div className="min-h-svh">
      <header className="border-b-4 border-primary bg-card px-6 py-4">
        <h1 className="text-xl font-semibold">
          Performance <span className="text-primary">Charting</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Compare a Strategy against a Benchmark over any Window.
        </p>
        <div className="mt-3">
          <SegmentedField
            label="Charting Library"
            options={CHARTING_LIBRARIES}
            labels={CHARTING_LIBRARY_LABELS}
            value={library}
            onChange={setLibrary}
          />
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        {indices.isPending ? (
          <div className="flex justify-center p-12">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : indices.isError ? (
          <p className="text-destructive">Could not reach the backend: {indices.error.message}</p>
        ) : (
          <>
            <ComparisonCard
              history={indices.data}
              axisSide={axisSide}
              library={library}
              onAxisSideChange={setAxisSide}
            />
            <DrawdownCard history={indices.data} axisSide={axisSide} library={library} />
            <DrawdownPeriodsCard history={indices.data} axisSide={axisSide} library={library} />
            <PerformanceBucketsCard history={indices.data} axisSide={axisSide} library={library} />
            <DrawdownPerformanceCard history={indices.data} axisSide={axisSide} library={library} />
          </>
        )}
      </main>
    </div>
  )
}
