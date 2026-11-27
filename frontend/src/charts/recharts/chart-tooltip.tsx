import type { ReactNode } from 'react'

/**
 * The subset of Recharts' tooltip content props this reads, typed loosely because Recharts types
 * values as `number | string | array` whatever the chart holds; plus the formatters.
 */
interface ChartTooltipProps {
  active?: boolean
  label?: unknown
  payload?: readonly { dataKey?: unknown; name?: unknown; value?: unknown; color?: string }[]
  /** The heading: the date or category under the pointer. */
  formatLabel?: (label: string) => ReactNode
  /** Each value's text; by item, so one chart can mix Levels and %. */
  formatValue: (value: number, dataKey: string) => string
}

/** Tooltip in the dashboard's card style, listing every series at the hovered x position. */
export function ChartTooltip({ active, payload, label, formatLabel, formatValue }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-md">
      <div className="mb-1 font-medium">{formatLabel ? formatLabel(String(label)) : String(label)}</div>
      {payload.map((item) => (
        <div key={String(item.dataKey)} className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          <span>{String(item.name)}</span>
          <span className="ml-auto pl-4 tabular-nums">{formatValue(Number(item.value), String(item.dataKey))}</span>
        </div>
      ))}
    </div>
  )
}
