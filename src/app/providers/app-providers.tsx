import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/shared/lib/query-client'
import { Toaster } from '@/components/ui/sonner'
import { EnvironmentRibbon } from '@/shared/components/EnvironmentRibbon'
import { IS_NON_PRODUCTION } from '@/shared/constants/app-env'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/*
        The viewport column: the environment ribbon (when present) takes its 24px
        off the top and the router fills the rest. This is why ProtectedLayout,
        Sidebar and LoginPage size against `h-full`/`min-h-full` rather than the
        viewport directly — the app shell no longer owns the full screen height.
      */}
      <div className="flex flex-col h-screen">
        {IS_NON_PRODUCTION && <EnvironmentRibbon />}
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
      <Toaster />
    </QueryClientProvider>
  )
}
