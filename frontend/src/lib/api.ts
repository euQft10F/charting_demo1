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

export const drawdownsResponseSchema = z.object({
  dates: z.array(z.iso.date()),
  /** Null when no Benchmark was asked for. */
  benchmark: seriesSchema.nullable(),
  /** Null when no Strategy was asked for. */
  strategy: seriesSchema.nullable(),
})
export type DrawdownsResponse = z.infer<typeof drawdownsResponseSchema>

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
