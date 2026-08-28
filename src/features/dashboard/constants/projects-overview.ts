import type { Project } from '@/features/dashboard/types/project-overview.types'

export const PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Payments Platform',
    color: 'red',
    open: 14,
    closed: 31,
    members: ['AS', 'MK', 'JL'],
  },
  {
    id: '2',
    name: 'Mobile Companion',
    color: 'blue',
    open: 8,
    closed: 22,
    members: ['RD', 'TO', 'PW'],
  },
  {
    id: '3',
    name: 'Admin Console',
    color: 'amber',
    open: 5,
    closed: 18,
    members: ['CL', 'HN'],
  },
  {
    id: '4',
    name: 'Infra & Platform',
    color: 'navy',
    open: 11,
    closed: 9,
    members: ['YG', 'BF', 'SR'],
  },
  {
    id: '5',
    name: 'Docs & Onboarding',
    color: 'orange',
    open: 3,
    closed: 27,
    members: ['AM', 'KT'],
  },
  {
    id: '6',
    name: 'Marketing Web',
    color: 'crimson',
    open: 7,
    closed: 14,
    members: ['VN', 'EL', 'DC'],
  },
]
