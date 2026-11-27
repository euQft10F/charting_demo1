import { Field, FieldLabel } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface SegmentedFieldProps<T extends string> {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  /** Text shown for each option; the option itself, capitalised, when left out. */
  labels?: Record<T, string>
}

/** A labelled single-choice toggle group; the chosen option can't be deselected. */
export function SegmentedField<T extends string>({ label, options, value, onChange, labels }: SegmentedFieldProps<T>) {
  return (
    <Field className="w-auto">
      <FieldLabel>{label}</FieldLabel>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={0}
        value={value}
        onValueChange={(v) => v && onChange(v as T)}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option}
            value={option}
            className="capitalize data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {labels?.[option] ?? option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  )
}
