import { ComparisonCard } from '@/cards/comparison-card'
import { Spinner } from '@/components/ui/spinner'
import { useIndices } from '@/lib/queries'

export default function App() {
  const indices = useIndices()

  return (
    <div className="min-h-svh">
      <header className="border-b-4 border-primary bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">
          Performance <span className="text-primary">Charting</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Compare a Strategy against a Benchmark over any Window.
        </p>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        {indices.isPending ? (
          <div className="flex justify-center p-12">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : indices.isError ? (
          <p className="text-destructive">Could not reach the backend: {indices.error.message}</p>
        ) : (
          <ComparisonCard
            indices={indices.data.indices}
            available={{ start: indices.data.start, end: indices.data.end }}
          />
        )}
      </main>
    </div>
  )
}
