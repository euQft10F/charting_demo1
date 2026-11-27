import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'

import {
  fetchDrawdownPerformance,
  fetchDrawdownPeriods,
  fetchDrawdowns,
  fetchIndices,
  fetchLevels,
  fetchPerformanceBuckets,
  type LevelsResponse,
  type PerformanceBucketsRequest,
} from '@/lib/api'
import { rebase } from '@/lib/comparison'
import { sliceLevels, type DateRange, type PairLevels } from '@/lib/window'

/** Performance Bucket means for a Benchmark, Strategy and resolved Window; computed by the backend. */
export function usePerformanceBuckets(request: PerformanceBucketsRequest) {
  return useQuery({
    queryKey: ['performance-buckets', request],
    queryFn: () => fetchPerformanceBuckets(request),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  })
}

export function useIndices() {
  return useQuery({ queryKey: ['indices'], queryFn: fetchIndices, staleTime: Infinity })
}

function combinePair([benchmark, strategy]: { data?: LevelsResponse; isFetching: boolean; error: Error | null }[]) {
  return {
    data:
      benchmark.data && strategy.data
        ? { dates: benchmark.data.dates, benchmark: benchmark.data.series[0], strategy: strategy.data.series[0] }
        : undefined,
    isFetching: benchmark.isFetching || strategy.isFetching,
    error: benchmark.error ?? strategy.error,
  } satisfies { data?: PairLevels; isFetching: boolean; error: Error | null }
}

/**
 * Full Level history of the Benchmark and Strategy; Windows are sliced in the browser.
 * Each Index is cached on its own, so changing or swapping one doesn't refetch the other.
 */
export function useLevels(benchmark: string, strategy: string) {
  return useQueries({
    queries: [benchmark, strategy].map((name) => ({
      queryKey: ['levels', name],
      queryFn: () => fetchLevels([name]),
      staleTime: Infinity,
      placeholderData: keepPreviousData,
    })),
    combine: combinePair,
  })
}

/**
 * The Levels of the Benchmark and Strategy cut to the Window, plus the same Levels `shown` on the
 * chart: rebased to 100 or raw. Toggling Rebase only recomputes `shown`.
 */
export function useWindowLevels(benchmark: string, strategy: string, range: DateRange, rebased: boolean) {
  const levels = useLevels(benchmark, strategy)
  // The React Compiler memoises both on their inputs, so `sliced` (and its `dates`) keeps its
  // identity across Rebase toggles and the charts don't refit.
  const sliced = levels.data && sliceLevels(levels.data, range)
  const level = rebased ? rebase : (values: number[]) => values
  const shown = sliced && { benchmark: level(sliced.benchmark.values), strategy: level(sliced.strategy.values) }
  return { levels, sliced, shown }
}

/** Drawdowns of the Benchmark and Strategy over a Window; the backend calculates them. */
export function useDrawdowns(benchmark: string, strategy: string, range: DateRange) {
  return useQuery({
    queryKey: ['drawdowns', benchmark, strategy, range.start, range.end],
    queryFn: () => fetchDrawdowns(benchmark, strategy, range),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  })
}

/** The Benchmark's `n` deepest Drawdown Periods over a Window; the backend calculates them. */
export function useDrawdownPeriods(benchmark: string, range: DateRange, n: number) {
  return useQuery({
    queryKey: ['drawdown-periods', benchmark, range.start, range.end, n],
    queryFn: () => fetchDrawdownPeriods(benchmark, range, n),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  })
}

/** Benchmark and Strategy returns over the Benchmark's `n` deepest Drawdown Periods; the backend calculates them. */
export function useDrawdownPerformance(benchmark: string, strategy: string, range: DateRange, n: number) {
  return useQuery({
    queryKey: ['drawdown-performance', benchmark, strategy, range.start, range.end, n],
    queryFn: () => fetchDrawdownPerformance(benchmark, strategy, range, n),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  })
}
