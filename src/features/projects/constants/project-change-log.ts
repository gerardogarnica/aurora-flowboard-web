import type { ProjectChangeLog, ProjectMember } from '../types/project.types'

/** The backend's default; it rejects anything above 100 with a 400. */
export const PROJECT_CHANGE_LOG_PAGE_SIZE = 20

export function formatProjectChangeLogEntry(log: ProjectChangeLog, members: ProjectMember[]): string {
  const actor = log.changedByFullName
  const memberName =
    log.affectedEntityName ?? members.find((m) => m.userId === log.affectedEntityId)?.fullName ?? 'a user'

  switch (log.changeType) {
    case 'Created':
      return `${actor} created the project`
    case 'Updated':
      return `${actor} updated the project details`
    case 'KindChanged':
      return `${actor} changed the project kind`
    case 'StatusChanged':
      return log.newStatus
        ? `${actor} changed the status to ${log.newStatus}`
        : `${actor} changed the status`
    case 'MemberAdded':
      return `${actor} added ${memberName} to the project`
    case 'MemberRemoved':
      return `${actor} removed ${memberName} from the project`
    default: {
      const label = String(log.changeType).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
      return `${actor} ${label}`
    }
  }
}
