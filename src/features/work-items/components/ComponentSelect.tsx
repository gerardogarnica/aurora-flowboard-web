import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ProjectComponent } from '@/features/projects/types/component.types'

function labelFor(component: ProjectComponent): string {
  return component.status === 'Retired' ? `${component.name} (Retired)` : component.name
}

export function ComponentSelect({
  components,
  value,
  onValueChange,
  defaultOpen,
  onOpenChange,
  triggerId,
  triggerClassName,
}: {
  components: ProjectComponent[]
  value: string
  onValueChange: (value: string) => void
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  triggerId?: string
  triggerClassName?: string
}) {
  const options = components.filter((c) => c.status === 'Active' || c.id === value)

  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v ?? '')}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger id={triggerId} className={cn('w-full', triggerClassName)}>
        <SelectValue>
          {(selected: string) => {
            const component = components.find((c) => c.id === selected)
            return component ? labelFor(component) : 'No component'
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">No component</SelectItem>
        {options.map((component) => (
          <SelectItem key={component.id} value={component.id}>
            {labelFor(component)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
