import { useId } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface LabelledCheckboxProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/** A checkbox with its label, sized to sit in the controls row beside the select fields. */
export function LabelledCheckbox({ label, checked, onCheckedChange }: LabelledCheckboxProps) {
  const id = useId()
  return (
    <div className="flex h-8 items-center gap-2 self-end">
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onCheckedChange(c === true)} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  )
}
