import { Suspense, type ReactNode } from 'react'

import { CHART_ADAPTERS, type ChartAdapter } from '@/charts/adapters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { CHARTING_LIBRARY_LABELS, type ChartingLibrary } from '@/lib/charting-library'
import { CHART_THEME } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  description: string
  controls: ReactNode
  /** Benchmark/Strategy names for the legend. */
  legend?: { benchmark?: string; strategy?: string; extras?: { color: string; label: string }[] }
  /**
   * The Charting Libraries to render with. One fills the chart area; several sit side by side in a
   * grid, each labelled, all drawing the same data.
   */
  libraries: readonly ChartingLibrary[]
  isFetching: boolean
  error: Error | null
  /** Set when the Window holds too little data for this chart. */
  emptyReason?: string
  /** Draws the chart with one Charting Library's renderers; left out until there is data to show. */
  renderChart?: (adapter: ChartAdapter) => ReactNode
}

export function ChartCard({
  title,
  description,
  controls,
  legend,
  libraries,
  isFetching,
  error,
  emptyReason,
  renderChart,
}: ChartCardProps) {
  const message = error ? (
    <Message tone="error">Could not load chart: {error.message}</Message>
  ) : (
    emptyReason && <Message>{emptyReason}</Message>
  )
  const compare = libraries.length > 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {controls}
        {legend && (
          <div className="flex gap-4 text-sm">
            {legend.benchmark && (
              <LegendItem color={CHART_THEME.benchmark} label={`${legend.benchmark} (Benchmark)`} />
            )}
            {legend.strategy && (
              <LegendItem color={CHART_THEME.strategy} label={`${legend.strategy} (Strategy)`} />
            )}
            {legend.extras?.map((e) => <LegendItem key={e.label} {...e} />)}
          </div>
        )}
        {message ? (
          <ChartArea isFetching={isFetching}>{message}</ChartArea>
        ) : (
          // One keyed panel per library, with or without a label, so a chart already drawn survives
          // a switch between one library and several.
          <div className={cn(compare && 'grid gap-4 lg:grid-cols-2')}>
            {libraries.map((library) => (
              <section key={library} className={cn(compare && 'flex flex-col gap-2 rounded-md border p-3')}>
                {compare && <h3 className="text-sm font-medium">{CHARTING_LIBRARY_LABELS[library]}</h3>}
                <ChartArea isFetching={isFetching}>{renderChart?.(CHART_ADAPTERS[library])}</ChartArea>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ChartAreaProps {
  /** Shows a spinner over the area while new data loads. */
  isFetching: boolean
  /** The chart, or a message in its place. */
  children: ReactNode
}

/** Where one chart is drawn, at a fixed height. */
function ChartArea({ isFetching, children }: ChartAreaProps) {
  return (
    <div className="relative h-80">
      {/* A lazily loaded renderer suspends until its library arrives. */}
      <Suspense fallback={<FillSpinner />}>{children}</Suspense>
      {isFetching && <FillSpinner />}
    </div>
  )
}

/** A spinner over the whole chart area. */
function FillSpinner() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-0.5 w-4 rounded" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function Message({ children, tone }: { children: ReactNode; tone?: 'error' }) {
  return (
    <div
      className={cn(
        'flex h-full items-center justify-center rounded-md border border-dashed text-sm',
        tone === 'error' ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {children}
    </div>
  )
}
