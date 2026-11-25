import { useId } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface LabelledCheckboxProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/** A checkbox with its label, as tall as the select fields so it lines up in the controls row. */
export function LabelledCheckbox({ label, checked, onCheckedChange }: LabelledCheckboxProps) {
  const id = useId()
  return (
    <div className="flex h-8 items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onCheckedChange(c === true)} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  )
}
