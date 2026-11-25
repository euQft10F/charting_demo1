import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'

import { fetchDrawdownPeriods, fetchDrawdowns, fetchLevels, fetchIndices, type LevelsResponse } from '@/lib/api'
import type { DateRange, PairLevels } from '@/lib/window'

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
