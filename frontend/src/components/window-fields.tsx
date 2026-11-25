import { useId } from 'react'
import { Controller, useWatch, type Control, type FieldValues, type Path } from 'react-hook-form'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { WINDOW_CHOICES } from '@/lib/window'
import type { WindowValues } from '@/lib/window-form'

interface WindowFieldsProps<T extends FieldValues & WindowValues> {
  control: Control<T>
  indices: string[]
  /** Offer "None" for the Benchmark and Strategy, which the form stores as an empty string. */
  optionalIndices?: boolean
}

/** Select items can't have an empty value, so "None" travels as this stand-in. */
const NONE = '__none__'

export function WindowFields<T extends FieldValues & WindowValues>({
  control,
  indices,
  optionalIndices = false,
}: WindowFieldsProps<T>) {
  const name = (n: keyof WindowValues) => n as Path<T>
  const preset = useWatch({ control, name: name('preset') })
  const id = useId()
  return (
    <div className="flex flex-wrap items-start gap-3">
      {(['benchmark', 'strategy'] as const).map((role) => (
        <Controller
          key={role}
          control={control}
          name={name(role)}
          render={({ field, fieldState }) => (
            <Field className="w-44" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-${role}`}>
                {role === 'benchmark' ? 'Benchmark' : 'Strategy'}
              </FieldLabel>
              <Select
                value={field.value || NONE}
                onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
              >
                <SelectTrigger id={`${id}-${role}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {optionalIndices && <SelectItem value={NONE}>None</SelectItem>}
                  {indices.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      ))}
      <Controller
        control={control}
        name={name('preset')}
        render={({ field }) => (
          <Field className="w-auto">
            <FieldLabel>Window</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={field.value}
              onValueChange={(v) => v && field.onChange(v)}
            >
              {WINDOW_CHOICES.map((p) => (
                <ToggleGroupItem
                  key={p}
                  value={p}
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {p}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        )}
      />
      {preset === 'Custom' &&
        (['start', 'end'] as const).map((bound) => (
          <Controller
            key={bound}
            control={control}
            name={name(bound)}
            render={({ field, fieldState }) => (
              <Field className="w-40" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-${bound}`}>
                  {bound === 'start' ? 'From' : 'To'}
                </FieldLabel>
                <Input
                  id={`${id}-${bound}`}
                  type="date"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ))}
    </div>
  )
}
