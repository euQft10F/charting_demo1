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

export interface PerformanceBucketsRequest {
  benchmark: string
  strategy: string
  /** ISO dates, inclusive. */
  start: string
  end: string
  /** Annualised Mean Return instead of the mean Daily Return. */
  annualise: boolean
}

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

export function fetchPerformanceBuckets({
  annualise,
  ...rest
}: PerformanceBucketsRequest): Promise<BarsResponse> {
  const params = new URLSearchParams({ ...rest, annualise: String(annualise) })
  return getJson(`/api/performance-buckets?${params}`, barsResponseSchema)
}
