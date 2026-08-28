import { Package, Briefcase, FlaskConical, Building2 } from 'lucide-react'
import type { ProjectKind } from '../types/project.types'

export const PROJECT_KINDS: ProjectKind[] = ['Product', 'Client', 'Research', 'Internal']

export const PROJECT_KIND_CONFIG: Record<
  ProjectKind,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  Product:  { icon: Package,      label: 'Product'  },
  Client:   { icon: Briefcase,    label: 'Client'   },
  Research: { icon: FlaskConical, label: 'Research' },
  Internal: { icon: Building2,    label: 'Internal' },
}
