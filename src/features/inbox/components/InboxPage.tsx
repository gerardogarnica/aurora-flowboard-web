import { PageHeader } from '@/shared/components/PageHeader'
import { UnderConstructionPlaceholder } from '@/shared/components/UnderConstructionPlaceholder'

export function InboxPage() {
  return (
    <>
      <PageHeader title="Inbox" subtitle="Notifications and mentions across your workspace." />
      <div className="flex-1 overflow-y-auto p-8">
        <UnderConstructionPlaceholder />
      </div>
    </>
  )
}
