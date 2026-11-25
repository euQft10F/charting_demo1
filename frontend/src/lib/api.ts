import { z } from 'zod'

// Mirrors the backend Pydantic models.

export const indicesResponseSchema = z.object({
  indices: z.array(z.string()),
  start: z.iso.date(),
  end: z.iso.date(),
})
export type IndicesResponse = z.infer<typeof indicesResponseSchema>

export const seriesSchema = z.object({
  name: z.string(),
  values: z.array(z.number()),
})
export type Series = z.infer<typeof seriesSchema>

export const levelsResponseSchema = z.object({
  dates: z.array(z.iso.date()),
  series: z.array(seriesSchema),
})
export type LevelsResponse = z.infer<typeof levelsResponseSchema>

/** Bar-chart data: `series[i].values[j]` belongs to `categories[j]`. Empty when there is too little data. */
export const barsResponseSchema = z.object({
  categories: z.array(z.string()),
  series: z.array(seriesSchema),
})
export type BarsResponse = z.infer<typeof barsResponseSchema>

/** The Return Frequencies offered, as the backend expects them (keep in step with `Frequency` in backend/app/buckets.py). */
export const RETURN_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const
export type ReturnFrequency = (typeof RETURN_FREQUENCIES)[number]

export interface PerformanceBucketsRequest {
  benchmark: string
  strategy: string
  /** ISO dates, inclusive. */
  start: string
  end: string
  /** Whether the ranked and averaged returns are Daily, Weekly or Monthly Returns. */
  frequency: ReturnFrequency
}

export const drawdownsResponseSchema = z.object({
  dates: z.array(z.iso.date()),
  /** Null when no Benchmark was asked for. */
  benchmark: seriesSchema.nullable(),
  /** Null when no Strategy was asked for. */
  strategy: seriesSchema.nullable(),
})
export type DrawdownsResponse = z.infer<typeof drawdownsResponseSchema>

export const drawdownPeriodsResponseSchema = z.object({
  /** Peak to trough of each deep Drawdown Episode, in chronological order. */
  periods: z.array(z.object({ start: z.iso.date(), end: z.iso.date() })),
})
export type DrawdownPeriodsResponse = z.infer<typeof drawdownPeriodsResponseSchema>
export type DrawdownPeriod = DrawdownPeriodsResponse['periods'][number]

async function getJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    const detail = await res.json().then((b: { detail?: unknown }) => b.detail, () => undefined)
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${res.status})`)
  }
  return schema.parse(await res.json())
}

export function fetchIndices(): Promise<IndicesResponse> {
  return getJson('/api/indices', indicesResponseSchema)
}

export function fetchLevels(names: string[]): Promise<LevelsResponse> {
  const params = new URLSearchParams(names.map((n) => ['names', n]))
  return getJson(`/api/levels?${params}`, levelsResponseSchema)
}

export function fetchPerformanceBuckets(request: PerformanceBucketsRequest): Promise<BarsResponse> {
  const params = new URLSearchParams({ ...request })
  return getJson(`/api/performance-buckets?${params}`, barsResponseSchema)
}

/** Drawdowns over a range; an empty `benchmark` or `strategy` leaves that Index out. */
export function fetchDrawdowns(
  benchmark: string,
  strategy: string,
  range: { start: string; end: string },
): Promise<DrawdownsResponse> {
  const params = new URLSearchParams({ ...range })
  if (benchmark) params.set('benchmark', benchmark)
  if (strategy) params.set('strategy', strategy)
  return getJson(`/api/drawdowns?${params}`, drawdownsResponseSchema)
}

/** The Benchmark's `n` deepest Drawdown Periods over a range. */
export function fetchDrawdownPeriods(
  benchmark: string,
  range: { start: string; end: string },
  n: number,
): Promise<DrawdownPeriodsResponse> {
  const params = new URLSearchParams({ benchmark, ...range, n: String(n) })
  return getJson(`/api/drawdown-periods?${params}`, drawdownPeriodsResponseSchema)
}
