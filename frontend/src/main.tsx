import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import '@/index.css'

// Keep cached data for good (the synthetic data never changes), so cards that unmount when the
// compare view is open show their data again at once on returning to the dashboard.
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, gcTime: Infinity } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
