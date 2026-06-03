import { useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { CreateProjectModal } from './CreateProjectModal'

export function ProjectsPage() {
  const [createProjectOpen, setCreateProjectOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="All projects in this workspace. Click any project to open its board."
        action={{ label: '+ New project', onClick: () => setCreateProjectOpen(true) }}
      />
      <CreateProjectModal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
      />
    </>
  )
}
