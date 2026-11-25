import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { DEFAULT_PRESET, WINDOW_CHOICES, resolveWindow, type DateRange, type Window } from '@/lib/window'

export const DEFAULT_BENCHMARK = 'Alpha Equity'
export const DEFAULT_STRATEGY = 'Gamma Momentum'

/** Fields every chart card has: Benchmark, Strategy and Window. Cards extend this shape. */
export const windowShape = {
  benchmark: z.string().min(1, 'Choose a Benchmark'),
  strategy: z.string().min(1, 'Choose a Strategy'),
  preset: z.enum(WINDOW_CHOICES),
  start: z.string(),
  end: z.string(),
}

export type WindowValues = z.infer<z.ZodObject<typeof windowShape>>

/** Validates the Custom Window against the available history. */
export function refineWindow(available: DateRange) {
  return (v: WindowValues, ctx: z.RefinementCtx) => {
    if (v.preset !== 'Custom') return
    const issue = (path: 'start' | 'end', message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message })
    if (!v.start) issue('start', 'Choose a start date')
    if (!v.end) issue('end', 'Choose an end date')
    if (!v.start || !v.end) return
    if (v.start >= v.end) issue('end', 'End must be after start')
    if (v.start < available.start) issue('start', `History starts ${available.start}`)
    if (v.end > available.end) issue('end', `History ends ${available.end}`)
  }
}

export function defaultWindowValues(available: DateRange): WindowValues {
  return {
    benchmark: DEFAULT_BENCHMARK,
    strategy: DEFAULT_STRATEGY,
    preset: DEFAULT_PRESET,
    start: available.start,
    end: available.end,
  }
}

export function toWindow(v: WindowValues): Window {
  return v.preset === 'Custom' ? { preset: 'Custom', start: v.start, end: v.end } : { preset: v.preset }
}

/**
 * The last valid form values: charts keep showing the previous valid selection while the
 * user is midway through editing (e.g. an invalid Custom Window).
 */
export function useAppliedValues<S extends z.ZodType>(schema: S, values: unknown): z.infer<S> {
  const parsed = schema.safeParse(values)
  const [applied, setApplied] = useState<z.infer<S>>(() => schema.parse(values))
  if (parsed.success && JSON.stringify(parsed.data) !== JSON.stringify(applied)) {
    setApplied(parsed.data)
  }
  return applied
}

/**
 * The Benchmark, Strategy and Window form every chart card starts from: the form itself, the last
 * valid selection, and that selection's Window resolved to concrete dates.
 *
 * With `optionalIndices`, either Index may be left empty, but not both.
 */
export function useWindowForm(available: DateRange, { optionalIndices = false } = {}) {
  const schema = useMemo(() => {
    const shape = optionalIndices ? { ...windowShape, benchmark: z.string(), strategy: z.string() } : windowShape
    return z.object(shape).superRefine((v, ctx) => {
      refineWindow(available)(v, ctx)
      if (optionalIndices && !v.benchmark && !v.strategy) {
        ctx.addIssue({ code: 'custom', path: ['strategy'], message: 'Choose a Benchmark or a Strategy' })
      }
    })
  }, [available, optionalIndices])
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultWindowValues(available),
    mode: 'onChange',
  })
  const values = useWatch({ control: form.control })
  const applied = useAppliedValues(schema, values)
  const range = useMemo(() => resolveWindow(toWindow(applied), available), [applied, available])
  return { form, applied, range }
}
