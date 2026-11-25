import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'

import { fetchLevels, fetchIndices, type LevelsResponse } from '@/lib/api'
import type { PairLevels } from '@/lib/window'

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
