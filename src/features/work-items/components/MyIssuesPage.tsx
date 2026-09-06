import { PageHeader } from '@/shared/components/PageHeader'
import { UnderConstructionPlaceholder } from '@/shared/components/UnderConstructionPlaceholder'

export function MyIssuesPage() {
  return (
    <>
      <PageHeader title="My issues" subtitle="Work items assigned to you across all projects." />
      <div className="flex-1 overflow-y-auto p-8">
        <UnderConstructionPlaceholder />
      </div>
    </>
  )
}
