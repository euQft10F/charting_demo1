import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchIndices, fetchLevels, type LevelsResponse } from '@/lib/api'
import type { PairLevels } from '@/lib/window'

export function useIndices() {
  return useQuery({ queryKey: ['indices'], queryFn: fetchIndices, staleTime: Infinity })
}

function toPair(res: LevelsResponse, benchmark: string, strategy: string): PairLevels {
  const find = (name: string) => {
    const s = res.series.find((x) => x.name === name)
    if (!s) throw new Error(`Missing Levels for ${name}`)
    return s
  }
  return { dates: res.dates, benchmark: find(benchmark), strategy: find(strategy) }
}

/** Full Level history of the Benchmark and Strategy; Windows are sliced in the browser. */
export function useLevels(benchmark: string, strategy: string) {
  return useQuery({
    queryKey: ['levels', benchmark, strategy],
    queryFn: async () => toPair(await fetchLevels([benchmark, strategy]), benchmark, strategy),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  })
}
