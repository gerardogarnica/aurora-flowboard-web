import { PageHeader } from '@/shared/components/PageHeader'
import { UnderConstructionPlaceholder } from '@/shared/components/UnderConstructionPlaceholder'

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Workspace-wide configuration and preferences." />
      <div className="flex-1 overflow-y-auto p-8">
        <UnderConstructionPlaceholder />
      </div>
    </>
  )
}
