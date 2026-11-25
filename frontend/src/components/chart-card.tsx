import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { BENCHMARK_COLOR, STRATEGY_COLOR } from '@/lib/colors'

interface ChartCardProps {
  title: string
  description: string
  controls: ReactNode
  /** Benchmark/Strategy names for the legend. */
  legend?: { benchmark: string; strategy: string }
  isFetching: boolean
  error: Error | null
  /** Set when the Window holds too little data for this chart. */
  emptyReason?: string
  /** Rendered once there is data to show. */
  children?: ReactNode
}

export function ChartCard({
  title,
  description,
  controls,
  legend,
  isFetching,
  error,
  emptyReason,
  children,
}: ChartCardProps) {
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
            <LegendItem color={BENCHMARK_COLOR} label={`${legend.benchmark} (Benchmark)`} />
            <LegendItem color={STRATEGY_COLOR} label={`${legend.strategy} (Strategy)`} />
          </div>
        )}
        <div className="relative h-80">
          {error ? (
            <Message tone="error">Could not load chart: {error.message}</Message>
          ) : emptyReason ? (
            <Message>{emptyReason}</Message>
          ) : (
            children
          )}
          {isFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <Spinner className="size-8 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
      className={`flex h-full items-center justify-center rounded-md border border-dashed text-sm ${
        tone === 'error' ? 'text-destructive' : 'text-muted-foreground'
      }`}
    >
      {children}
    </div>
  )
}
