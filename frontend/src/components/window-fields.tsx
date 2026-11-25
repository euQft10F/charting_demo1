import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { WINDOW_CHOICES } from '@/lib/window'
import type { WindowValues } from '@/lib/window-form'

interface WindowFieldsProps<T extends FieldValues & WindowValues> {
  control: Control<T>
  indices: string[]
  preset: WindowValues['preset']
}

export function WindowFields<T extends FieldValues & WindowValues>({
  control,
  indices,
  preset,
}: WindowFieldsProps<T>) {
  const name = (n: keyof WindowValues) => n as Path<T>
  return (
    <div className="flex flex-wrap items-start gap-3">
      {(['benchmark', 'strategy'] as const).map((role) => (
        <Controller
          key={role}
          control={control}
          name={name(role)}
          render={({ field, fieldState }) => (
            <Field className="w-44" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${role}-${field.name}`}>
                {role === 'benchmark' ? 'Benchmark' : 'Strategy'}
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`${role}-${field.name}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                <FieldLabel htmlFor={`${bound}-${field.name}`}>
                  {bound === 'start' ? 'From' : 'To'}
                </FieldLabel>
                <Input
                  id={`${bound}-${field.name}`}
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
