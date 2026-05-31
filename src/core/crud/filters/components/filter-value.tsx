/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { useFilters, type TFilterValue, type TValue } from ".."
import { IconCheck, IconDots } from "@tabler/icons-react"
import { format, isEqual } from "date-fns"
import React from "react"
import { DebouncedInput } from "./debounced-input"
import { createNumberRange } from "../lib/helpers"
import type { DateRange } from "react-day-picker"
import { useDebounceCallback } from "../hooks/use-debounce-callback"
import {
  DateOperator,
  getDefaultOperator,
  NumberOperator,
  RangeOperator,
} from "../lib/operators"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type TFilterValueProps = {
  field: TField
  filter?: TValue
}

export const FilterValue = React.memo(__FilterValue) as typeof __FilterValue

function __FilterValue({ field }: { field: TField }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { filters, onChange } = useFilters()
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="m-0 h-full w-fit rounded-none p-0 px-2 text-xs whitespace-nowrap"
          >
            <FilterValueDisplay field={field} filter={filters![field.name!]} />
          </Button>
        }
      ></PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="w-fit p-0!">
        <FilterValueController
          field={field}
          filters={filters}
          onChange={onChange}
        />
      </PopoverContent>
    </Popover>
  )
}

export function FilterValueDisplay({ field, filter }: TFilterValueProps) {
  if (["hidden", "object", "array"].includes(field.type)) return null

  const textTypes = ["text", "url", "email", "phone"].includes(field.type)
  if (textTypes && !field.enum)
    return <FilterValueTextDisplay filter={filter} />

  if (textTypes && field.enum)
    return <FilterValueMultiOptionDisplay filter={filter} field={field} />

  if (field.type === "date") return <FilterValueDateDisplay filter={filter} />

  if (field.type === "number")
    return <FilterValueNumberDisplay filter={filter} field={field} />

  if (field.type === "boolean")
    return <FilterValueBooleanDisplay filter={filter} />
}

export function FilterValueMultiOptionDisplay({
  field,
  filter,
}: TFilterValueProps) {
  const options = React.useMemo(
    () =>
      (
        (field.enum ?? []) as unknown as Array<
          { icon?: React.ElementType; label: string; value: string } | string
        >
      ).map((v) =>
        typeof v === "string"
          ? { icon: undefined, label: v, value: v }
          : { ...v, icon: v?.icon ?? undefined }
      ),
    [field]
  )

  const selected = React.useMemo(
    () => options.filter((o) => filter?.value.includes(o.value)),
    [filter?.value, options]
  )

  if (selected.length === 1) {
    const { label, icon: Icon } = selected[0]
    return (
      <span className="inline-flex items-center gap-1.5">
        {Icon && <Icon className="size-4 text-primary" />}

        <span>{label}</span>
      </span>
    )
  }

  const name = (field.label ?? field.name ?? "option").toLowerCase()
  const pluralName = name.endsWith("s") ? `${name}es` : `${name}s`
  const hasOptionIcons = !options?.some((o) => !o.icon)

  return (
    <div className="inline-flex items-center gap-1.5">
      {hasOptionIcons && (
        <div key="icons" className="inline-flex items-center gap-0.5">
          {selected.slice(0, 3).map((item) => {
            const { value, icon: Icon } = item
            return Icon ? <Icon key={value} className="size-4" /> : null
          })}
        </div>
      )}
      <span>
        {selected.length} {pluralName}
      </span>
    </div>
  )
}

function formatDateRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameMonth && sameYear) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`
  }

  if (sameYear) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
  }

  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`
}

export function FilterValueDateDisplay({ filter }: { filter?: TValue }) {
  if (!filter?.value) return null

  if (Array.isArray(filter?.value) && filter?.value.length === 0)
    return <IconDots className="size-4" />
  if (Array.isArray(filter?.value) && filter?.value.length === 1) {
    const value = filter?.value[0]

    const formattedDateStr = format(value, "MMM d, yyyy")

    return <span>{formattedDateStr}</span>
  }

  const formattedRangeStr = formatDateRange(filter?.value[0], filter?.value[1])

  return <span>{formattedRangeStr}</span>
}

export function FilterValueTextDisplay({ filter }: { filter?: TValue }) {
  const value = filter?.value

  if (value.length === 0 || value.trim() === "")
    return <IconDots className="size-4" />

  return <span>{value}</span>
}

export function FilterValueBooleanDisplay({ filter }: { filter?: TValue }) {
  const value = filter?.value

  return <span>{value?.toString()}</span>
}

export function FilterValueNumberDisplay({ filter }: TFilterValueProps) {
  if (!filter || !filter?.value || filter?.value.length === 0) return null

  if (
    filter.operator === RangeOperator["is between"] ||
    filter.operator === RangeOperator["is not between"]
  ) {
    const minValue = filter.value[0]
    const maxValue = filter.value[1]

    return (
      <span className="tracking-tight tabular-nums">
        {minValue} and {maxValue}
      </span>
    )
  }

  const value = filter.value[0]
  return <span className="tracking-tight tabular-nums">{value}</span>
}

/****** Property Filter Value Controller ******/
export const FilterValueController = React.memo(
  __FilterValueController
) as typeof __FilterValueController

function __FilterValueController({
  filters,
  field,
  onChange,
}: {
  filters?: TFilterValue
  field: TField
  onChange: (value: TFilterValue) => void
}) {
  if (["hidden", "object", "array"].includes(field.type)) return null
  const textTypes = ["text", "url", "email", "phone"].includes(field.type)

  const filter = filters?.[field.name!]

  const defaultOperator = getDefaultOperator(field, filter)

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleChange = React.useCallback(
    (value: any, operator?: string) =>
      onChange({
        ...filters,
        [field.name!]: {
          ...filter,
          value,
          operator: operator ?? filter?.operator ?? defaultOperator,
        },
      }),
    [filters, field, onChange, filter, defaultOperator]
  )

  if (textTypes && !field.enum)
    return <FilterValueTextController filter={filter} onChange={handleChange} />

  if (textTypes && field.enum)
    return (
      <FilterValueMultiOptionController
        filter={filter}
        field={field}
        onChange={handleChange}
      />
    )

  if (field.type === "date")
    return <FilterValueDateController filter={filter} onChange={handleChange} />

  if (field.type === "number")
    return (
      <FilterValueNumberController
        filter={filter}
        field={field}
        onChange={handleChange}
      />
    )

  if (field.type === "boolean")
    return (
      <FilterValueBooleanController
        filter={filter}
        field={field}
        onChange={handleChange}
      />
    )
}

export function OptionItem({
  onSelect,
  ...item
}: {
  icon?: React.ElementType
  label: string
  value: string
  checked: boolean
  onSelect: (value: string) => void
}) {
  const handleSelect = React.useCallback(() => {
    onSelect(item.value)
  }, [onSelect, item.value])

  return (
    <CommandItem
      key={item.value as string}
      onSelect={handleSelect}
      value={item.value}
      className="group flex items-center justify-between gap-1.5 px-2"
    >
      <div className="flex items-center gap-1.5">
        {item.icon && <item.icon className="size-4 text-primary" />}
        <span>{item.label}</span>
      </div>

      <CommandShortcut>
        <IconCheck
          className={cn("size-4", item.checked ? "opacity-100" : "opacity-0")}
        />
      </CommandShortcut>
    </CommandItem>
  )
}

export function FilterValueMultiOptionController({
  filter,
  field,
  onChange,
}: TFilterValueProps & {
  onChange: (value: string[]) => void
}) {
  const [values, setValues] = React.useState<string[]>(filter?.value ?? [])
  // Compute initial options once per mount
  const initialOptions = React.useMemo(() => {
    return (
      (field.enum ?? []) as Array<{
        icon?: React.ElementType
        value: string
        label: string
      }>
    ).map((v) =>
      typeof v === "string"
        ? { icon: undefined, value: v, label: v }
        : { ...v, icon: v?.icon ?? undefined }
    )
  }, [field])

  const setFilterValueDebounced = useDebounceCallback(onChange, 800)

  const handleChange = React.useCallback(
    (value: string[]) => {
      setFilterValueDebounced(value)
    },
    [setFilterValueDebounced]
  )

  return (
    <Command loop>
      <CommandInput autoFocus placeholder="Search" />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        <CommandGroup className={cn(initialOptions.length === 0 && "hidden")}>
          {initialOptions.map((option) => (
            <OptionItem
              key={option.value}
              {...option}
              checked={values.includes(option.value)}
              onSelect={(value) => {
                const updatedValues = values.includes(value)
                  ? ((values ?? []) as string[]).filter((v) => v !== value)
                  : [...(values ?? []), value]

                setValues(updatedValues)
                handleChange(updatedValues)
              }}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function FilterValueDateController({
  filter,
  onChange,
}: {
  filter?: TValue
  onChange: (value: Date[], operator?: string) => void
}) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: filter?.value[0] ?? new Date(),
    to: filter?.value[1] ?? undefined,
  })

  const setFilterValueDebounced = useDebounceCallback(onChange, 500)

  function changeDateRange(value: DateRange | undefined) {
    const start = value?.from
    const end =
      start && value && value.to && !isEqual(start, value.to)
        ? value.to
        : undefined

    setDate({ from: start, to: end })

    const isRange = start && end
    const newValues = isRange ? [start, end] : start ? [start] : []

    const newOperator =
      newValues.length === 1 ? DateOperator.is : RangeOperator["is between"]

    setFilterValueDebounced(newValues, newOperator)
  }

  return (
    <Command>
      <CommandList className="max-h-fit">
        <div>
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={changeDateRange}
            numberOfMonths={1}
            captionLayout="dropdown"
          />
        </div>
      </CommandList>
    </Command>
  )
}

export function FilterValueBooleanController({
  filter,
  field,
  onChange,
}: TFilterValueProps & {
  onChange: (value: boolean) => void
}) {
  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandItem className="px-2 [&_svg]:hidden">
          <Switch
            id={field.name}
            checked={filter?.value ?? false}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <Label htmlFor={field.name}>{field.label ?? field.name}</Label>
        </CommandItem>
      </CommandList>
    </Command>
  )
}

export function FilterValueTextController({
  filter,
  onChange,
}: {
  filter?: TValue
  onChange: (value: string | number) => void
}) {
  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandItem className="px-2 [&_svg]:hidden">
          <DebouncedInput
            placeholder="Search..."
            autoFocus
            value={filter?.value ?? ""}
            onChange={onChange}
          />
        </CommandItem>
      </CommandList>
    </Command>
  )
}

export function FilterValueNumberController({
  filter,
  field,
  onChange,
}: TFilterValueProps & {
  onChange: (value: number | number[], operator?: string) => void
}) {
  const minMax = React.useMemo(
    () => [field.minimum ?? 0, field.maximum ?? 0],
    [field]
  )
  const [sliderMin, sliderMax] = [
    minMax ? minMax[0] : 0,
    minMax ? minMax[1] : 0,
  ]

  // Local state for values
  const [values, setValues] = React.useState<number[]>(filter?.value ?? [0, 0])

  const isNumberRange = React.useMemo(
    () =>
      filter && Object.values(RangeOperator).includes(filter.operator as any),
    [filter]
  )

  const setFilterValueDebounced = useDebounceCallback(onChange, 300)

  const changeNumber = (value: number[]) => {
    setValues(value)
    setFilterValueDebounced(value)
  }

  const changeMinNumber = (value: number) => {
    const newValues = createNumberRange([value, values[1]])
    setValues(newValues)
    setFilterValueDebounced(newValues)
  }

  const changeMaxNumber = (value: number) => {
    const newValues = createNumberRange([values[0], value])
    setValues(newValues)
    setFilterValueDebounced(newValues)
  }

  const changeType = React.useCallback(
    (type: "single" | "range") => {
      let newValues: number[] = []
      if (type === "single")
        newValues = [values[0]] // Keep the first value for single mode
      else if (!minMax)
        newValues = createNumberRange([values[0], values[1] ?? 0])
      else {
        const value = values[0]
        newValues =
          value - minMax[0] < minMax[1] - value
            ? createNumberRange([value, minMax[1]])
            : createNumberRange([minMax[0], value])
      }

      const newOperator =
        type === "single" ? NumberOperator.is : RangeOperator["is between"]

      // Update local state
      setValues(newValues)
      setFilterValueDebounced.cancel()

      onChange?.(newValues, newOperator)
    },
    [values, minMax, setFilterValueDebounced, onChange]
  )

  return (
    <Command>
      <CommandList className="w-75 px-2 py-2">
        <CommandGroup>
          <div className="flex w-full flex-col">
            <Tabs
              value={isNumberRange ? "range" : "single"}
              onValueChange={(v) => changeType(v as "single" | "range")}
            >
              <TabsList className="w-full *:text-xs">
                <TabsTrigger value="single">Single</TabsTrigger>
                <TabsTrigger value="range">Range</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="mt-4 flex flex-col gap-4">
                {minMax && (
                  <Slider
                    value={[values[0]]}
                    onValueChange={(value) => changeNumber([value as number])}
                    min={sliderMin}
                    max={sliderMax}
                    step={1}
                    aria-orientation="horizontal"
                  />
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Value</span>
                  <DebouncedInput
                    id="single"
                    type="number"
                    value={values[0].toString()} // Use values[0] directly
                    onChange={(v) => changeNumber([Number(v)])}
                  />
                </div>
              </TabsContent>
              <TabsContent value="range" className="mt-4 flex flex-col gap-4">
                {minMax && (
                  <Slider
                    value={values} // Use values directly
                    onValueChange={(value) => changeNumber(value as number[])}
                    min={sliderMin}
                    max={sliderMax}
                    step={1}
                    aria-orientation="horizontal"
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Min</span>
                    <DebouncedInput
                      type="number"
                      value={values[0]}
                      onChange={(v) => changeMinNumber(Number(v))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Max</span>
                    <DebouncedInput
                      type="number"
                      value={values[1]}
                      onChange={(v) => changeMaxNumber(Number(v))}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
