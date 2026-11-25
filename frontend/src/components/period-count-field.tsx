import { useId } from 'react'

import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/** How many of the Benchmark's deepest Drawdown Periods a chart can show. */
const PERIOD_COUNTS = Array.from({ length: 10 }, (_, i) => i + 1)
export const DEFAULT_PERIOD_COUNT = 2

interface PeriodCountFieldProps {
  value: number
  onChange: (count: number) => void
}

/** A picker for the number of Drawdown Periods, from 1 to 10. */
export function PeriodCountField({ value, onChange }: PeriodCountFieldProps) {
  const id = useId()
  return (
    <Field className="w-28">
      <FieldLabel htmlFor={id}>Periods shown</FieldLabel>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_COUNTS.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
