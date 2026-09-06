import { PageHeader } from '@/shared/components/PageHeader'
import { UnderConstructionPlaceholder } from '@/shared/components/UnderConstructionPlaceholder'

export function SavedViewsPage() {
  return (
    <>
      <PageHeader title="Saved views" subtitle="Filtered views you've saved for quick access." />
      <div className="flex-1 overflow-y-auto p-8">
        <UnderConstructionPlaceholder />
      </div>
    </>
  )
}
